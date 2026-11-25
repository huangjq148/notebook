package services

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/jmoiron/sqlx"
)

func validBatchOrders() []BatchOrder {
	return []BatchOrder{
		{Name: "商品甲", Contact: "客户", BuyPrice: "1.25", SellPrice: "2.5", Number: "2", OtherCost: "0", OrderTime: "2026-11-18"},
		{Name: "商品乙", Contact: "客户", BuyPrice: "0", SellPrice: "0", Number: "0.5", OtherCost: "0.2", OrderTime: "2026-11-18"},
	}
}

const testBatchID = "0123456789abcdef0123456789abcdef"

func TestBatchValidation(t *testing.T) {
	if err := validateBatch(testBatchID, validBatchOrders()); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		name   string
		mutate func(*BatchOrder)
	}{
		{"missing name", func(o *BatchOrder) { o.Name = " " }},
		{"missing contact", func(o *BatchOrder) { o.Contact = "" }},
		{"invalid date", func(o *BatchOrder) { o.OrderTime = "2026-02-30" }},
		{"zero quantity", func(o *BatchOrder) { o.Number = "0" }},
		{"negative price", func(o *BatchOrder) { o.SellPrice = "-1" }},
		{"not finite", func(o *BatchOrder) { o.BuyPrice = "NaN" }},
		{"too many decimals", func(o *BatchOrder) { o.Number = "1.23456" }},
		{"oversized fee", func(o *BatchOrder) { o.OtherCost = "12345678901" }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rows := validBatchOrders()
			tc.mutate(&rows[1])
			_, err := CreateOrdersBatch(context.Background(), nil, "7", testBatchID, rows)
			var validation *BatchValidationError
			if !errors.As(err, &validation) || !strings.Contains(err.Error(), "第 2 行") {
				t.Fatalf("expected row validation before transaction, got %v", err)
			}
		})
	}
	for _, tc := range []struct {
		id   string
		rows []BatchOrder
	}{
		{"bad", validBatchOrders()}, {testBatchID, nil}, {testBatchID, make([]BatchOrder, 501)},
	} {
		if validateBatch(tc.id, tc.rows) == nil {
			t.Fatal("accepted invalid batch")
		}
	}
}

// A small scripted SQL driver verifies transaction boundaries and that retries
// do not execute order inserts. It does not replace an InnoDB integration test.
type batchSQLStep struct {
	kind, query string
	values      [][]driver.Value
	err         error
	check       func([]driver.NamedValue)
}
type batchSQLDriver struct {
	t     *testing.T
	steps []batchSQLStep
}
type batchSQLConn struct {
	script *batchSQLDriver
	lastID int64
}
type batchSQLTx struct{ script *batchSQLDriver }
type batchSQLRows struct{ values [][]driver.Value }

var batchDriverNumber int64

func (s *batchSQLDriver) next(kind, query string, args []driver.NamedValue) batchSQLStep {
	s.t.Helper()
	if len(s.steps) == 0 {
		s.t.Fatalf("unexpected SQL %s: %s", kind, query)
	}
	step := s.steps[0]
	s.steps = s.steps[1:]
	if step.kind != kind || !strings.Contains(query, step.query) {
		s.t.Fatalf("got %s %s, want %s %s", kind, query, step.kind, step.query)
	}
	if step.check != nil {
		step.check(args)
	}
	return step
}
func (s *batchSQLDriver) Open(string) (driver.Conn, error) {
	return &batchSQLConn{script: s, lastID: 100}, nil
}
func (c *batchSQLConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("unexpected Prepare")
}
func (c *batchSQLConn) Close() error { return nil }
func (c *batchSQLConn) Begin() (driver.Tx, error) {
	step := c.script.next("begin", "", nil)
	return &batchSQLTx{c.script}, step.err
}
func (c *batchSQLConn) ExecContext(_ context.Context, q string, args []driver.NamedValue) (driver.Result, error) {
	step := c.script.next("exec", q, args)
	if strings.Contains(q, "INSERT INTO t_order\n") {
		c.lastID++
	}
	return batchSQLResult{id: c.lastID}, step.err
}

// RowsAffected has no LastInsertId, so use a result that supports generated IDs.
type batchSQLResult struct{ id int64 }

func (r batchSQLResult) LastInsertId() (int64, error) { return r.id, nil }
func (batchSQLResult) RowsAffected() (int64, error)   { return 1, nil }
func (c *batchSQLConn) QueryContext(_ context.Context, q string, args []driver.NamedValue) (driver.Rows, error) {
	step := c.script.next("query", q, args)
	return &batchSQLRows{step.values}, step.err
}
func (t *batchSQLTx) Commit() error       { return t.script.next("commit", "", nil).err }
func (t *batchSQLTx) Rollback() error     { return t.script.next("rollback", "", nil).err }
func (r *batchSQLRows) Columns() []string { return []string{"payloadHash", "orderIds"} }
func (r *batchSQLRows) Close() error      { return nil }
func (r *batchSQLRows) Next(dest []driver.Value) error {
	if len(r.values) == 0 {
		return io.EOF
	}
	copy(dest, r.values[0])
	r.values = r.values[1:]
	return nil
}

func batchTestDB(t *testing.T, steps []batchSQLStep) *sqlx.DB {
	t.Helper()
	script := &batchSQLDriver{t: t, steps: steps}
	name := "batch-test-" + string(rune(atomic.AddInt64(&batchDriverNumber, 1)+64))
	sql.Register(name, script)
	raw, err := sql.Open(name, "")
	if err != nil {
		t.Fatal(err)
	}
	db := sqlx.NewDb(raw, "mysql")
	t.Cleanup(func() {
		db.Close()
		if len(script.steps) > 0 {
			t.Errorf("%d unexecuted transaction steps", len(script.steps))
		}
	})
	return db
}
func claimBatchSteps(ids string) []batchSQLStep {
	payload, _ := json.Marshal(validBatchOrders())
	digest := sha256.Sum256(payload)
	return []batchSQLStep{
		{kind: "begin"},
		{kind: "exec", query: "INSERT INTO t_order_batch"},
		{kind: "query", query: "FOR UPDATE", values: [][]driver.Value{{hex.EncodeToString(digest[:]), ids}}},
	}
}

func TestBatchCommitsOrdersAndReceiptTogether(t *testing.T) {
	steps := claimBatchSteps("")
	steps[1].check = func(args []driver.NamedValue) {
		if args[0].Value != "7" || args[1].Value != testBatchID {
			t.Fatal("receipt not scoped to current user/request")
		}
	}
	steps = append(steps, batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"}, batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"}, batchSQLStep{kind: "exec", query: "UPDATE t_order_batch", check: func(args []driver.NamedValue) {
		if args[0].Value != "[101,102]" {
			t.Fatalf("unexpected receipt %v", args[0].Value)
		}
	}}, batchSQLStep{kind: "commit"})
	result, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, validBatchOrders())
	if err != nil || result.Replayed || len(result.OrderIDs) != 2 {
		t.Fatalf("unexpected result %+v, %v", result, err)
	}
}
func TestBatchInsertFailureRollsBack(t *testing.T) {
	steps := append(claimBatchSteps(""), batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"}, batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n", err: errors.New("second insert failed")}, batchSQLStep{kind: "rollback"})
	result, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, validBatchOrders())
	if err == nil || len(result.OrderIDs) != 0 {
		t.Fatalf("expected full failure: %+v %v", result, err)
	}
}
func TestBatchRetryReturnsReceiptWithoutInserting(t *testing.T) {
	steps := append(claimBatchSteps("[101,102]"), batchSQLStep{kind: "rollback"})
	result, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, validBatchOrders())
	if err != nil || !result.Replayed || len(result.OrderIDs) != 2 || result.OrderIDs[1] != 102 {
		t.Fatalf("unexpected replay: %+v %v", result, err)
	}
}
func TestBatchRejectsChangedPayloadForSameRequest(t *testing.T) {
	steps := append(claimBatchSteps("[101,102]"), batchSQLStep{kind: "rollback"})
	orders := validBatchOrders()
	orders[0].Number = "3"
	_, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, orders)
	if !errors.Is(err, ErrBatchConflict) {
		t.Fatalf("expected conflict, got %v", err)
	}
}

func TestBatchReceiptWriteFailureRollsBackOrders(t *testing.T) {
	steps := append(claimBatchSteps(""),
		batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"},
		batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"},
		batchSQLStep{kind: "exec", query: "UPDATE t_order_batch", err: errors.New("receipt write failed")},
		batchSQLStep{kind: "rollback"})
	result, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, validBatchOrders())
	if err == nil || len(result.OrderIDs) != 0 {
		t.Fatalf("expected receipt and orders to fail together: %+v %v", result, err)
	}
}

func TestBatchCommitErrorDoesNotReportSuccess(t *testing.T) {
	steps := append(claimBatchSteps(""),
		batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"},
		batchSQLStep{kind: "exec", query: "INSERT INTO t_order\n"},
		batchSQLStep{kind: "exec", query: "UPDATE t_order_batch"},
		batchSQLStep{kind: "commit", err: errors.New("connection lost during commit")})
	result, err := CreateOrdersBatch(context.Background(), batchTestDB(t, steps), "7", testBatchID, validBatchOrders())
	if err == nil || len(result.OrderIDs) != 0 {
		t.Fatalf("ambiguous commit must not report success: %+v %v", result, err)
	}
}
