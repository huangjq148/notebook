package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jmoiron/sqlx"
	"hjq-notebook/internal/utils"
)

// BatchOrder intentionally excludes IDs, ownership and stock fields. This endpoint
// creates ordinary orders; inventory orders continue to use their existing flow.
type BatchOrder struct {
	Name      string `json:"name"`
	Contact   string `json:"contact"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	BuyPrice  string `json:"buyPrice"`
	SellPrice string `json:"sellPrice"`
	Number    string `json:"number"`
	OtherCost string `json:"otherCost"`
	Remark    string `json:"remark"`
	OrderTime string `json:"orderTime"`
}

type BatchOrderResult struct {
	OrderIDs []int64 `json:"orderIds"`
	Replayed bool    `json:"replayed"`
}

type BatchValidationError struct{ Message string }

func (e *BatchValidationError) Error() string { return e.Message }

var ErrBatchConflict = errors.New("提交编号已用于不同的订单内容，请重新发起提交")
var batchRequestIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{16,64}$`)
var batchNumberPattern = regexp.MustCompile(`^[0-9]{1,12}(\.[0-9]{1,4})?$`)

func validateBatch(requestID string, orders []BatchOrder) error {
	invalid := func(message string) error { return &BatchValidationError{message} }
	if !batchRequestIDPattern.MatchString(requestID) {
		return invalid("缺少有效的提交编号")
	}
	if len(orders) < 1 || len(orders) > 500 {
		return invalid("每批应包含 1 到 500 行商品")
	}
	for i, order := range orders {
		rowError := func(message string) error { return invalid(fmt.Sprintf("第 %d 行：%s", i+1, message)) }
		if strings.TrimSpace(order.Name) == "" || strings.TrimSpace(order.Contact) == "" {
			return rowError("商品名和客户姓名不能为空")
		}
		for _, field := range []struct {
			label, value string
			max          int
		}{
			{"商品名", order.Name, 100}, {"客户姓名", order.Contact, 100}, {"电话", order.Phone, 15},
			{"地址", order.Address, 100}, {"备注", order.Remark, 255},
		} {
			if utf8.RuneCountInString(field.value) > field.max {
				return rowError(field.label + "过长")
			}
		}
		if _, err := time.Parse("2006-01-02", order.OrderTime); err != nil {
			return rowError("日期格式应为 YYYY-MM-DD")
		}
		for _, field := range []struct {
			label, value string
			max          int
		}{
			{"进价", order.BuyPrice, 20}, {"售价", order.SellPrice, 20}, {"数量", order.Number, 20}, {"其他费用", order.OtherCost, 10},
		} {
			if !batchNumberPattern.MatchString(field.value) || len(field.value) > field.max {
				return rowError(field.label + "应为非负数字，最多四位小数，且不能超过字段长度")
			}
		}
		number, _ := strconv.ParseFloat(order.Number, 64)
		if number <= 0 {
			return rowError("数量必须大于零")
		}
	}
	return nil
}

// CreateOrdersBatch serializes identical request IDs through an InnoDB unique
// key lock. The receipt and every order commit together, including on retry after
// an ambiguous network/commit error. Different users have independent keys.
func CreateOrdersBatch(ctx context.Context, db *sqlx.DB, userID, requestID string, orders []BatchOrder) (BatchOrderResult, error) {
	result := BatchOrderResult{}
	if err := validateBatch(requestID, orders); err != nil {
		return result, err
	}
	payload, err := json.Marshal(orders)
	if err != nil {
		return result, err
	}
	digest := sha256.Sum256(payload)
	hash := hex.EncodeToString(digest[:])
	ctx, cancel := context.WithTimeout(ctx, 25*time.Second)
	defer cancel()
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return result, err
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, `INSERT INTO t_order_batch (createUser,requestId,payloadHash,orderIds,createTime)
 VALUES (?,?,?,'',?) ON DUPLICATE KEY UPDATE requestId=requestId`, userID, requestID, hash, utils.GetNow())
	if err != nil {
		return result, err
	}
	var receipt struct {
		Hash string `db:"payloadHash"`
		IDs  string `db:"orderIds"`
	}
	err = tx.GetContext(ctx, &receipt, `SELECT payloadHash,orderIds FROM t_order_batch WHERE createUser=? AND requestId=? FOR UPDATE`, userID, requestID)
	if err != nil {
		return result, err
	}
	if receipt.Hash != hash {
		return result, ErrBatchConflict
	}
	if receipt.IDs != "" {
		err = json.Unmarshal([]byte(receipt.IDs), &result.OrderIDs)
		result.Replayed = true
		return result, err
	}
	result.OrderIDs = make([]int64, 0, len(orders))
	for _, order := range orders {
		inserted, err := tx.ExecContext(ctx, `INSERT INTO t_order
 (name,contact,phone,address,buyPrice,sellPrice,number,otherCost,remark,orderTime,status,stockId,createUser,createTime)
 VALUES (?,?,?,?,?,?,?,?,?,?,'1',0,?,?)`, order.Name, order.Contact, order.Phone, order.Address, order.BuyPrice, order.SellPrice, order.Number, order.OtherCost, order.Remark, order.OrderTime, userID, utils.GetNow())
		if err != nil {
			return BatchOrderResult{}, err
		}
		id, err := inserted.LastInsertId()
		if err != nil {
			return BatchOrderResult{}, err
		}
		result.OrderIDs = append(result.OrderIDs, id)
	}
	ids, _ := json.Marshal(result.OrderIDs)
	_, err = tx.ExecContext(ctx, `UPDATE t_order_batch SET orderIds=? WHERE createUser=? AND requestId=?`, string(ids), userID, requestID)
	if err != nil {
		return BatchOrderResult{}, err
	}
	if err := tx.Commit(); err != nil {
		return BatchOrderResult{}, err
	}
	return result, nil
}
