// Package oplog 操作日志（审计日志）
//
// 设计要点：
//  1. 记录动作本身绝不能影响业务接口：写入走带缓冲的 channel + 单个消费 goroutine，
//     队列满时直接丢弃并打日志，HTTP 请求不会等待数据库。
//  2. 中间件负责「通用字段」（谁、什么时候、哪个方法、哪个路径、IP、耗时、成功与否），
//     业务 handler 只通过本包的 SetXxx 补充「业务语义」（模块、动作、目标 ID、改前/改后快照）。
//  3. 快照由 handler 在做写操作前用同一条 SQL 查一次旧记录得到，中间件不做通用反查
//     （拿不到表名，只能靠猜，不可靠）。
package oplog

import (
	"encoding/json"
	"log"
	"strings"
	"sync"
	"sync/atomic"
	"unicode/utf8"

	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// OperationLog 对应表 t_operation_log
type OperationLog struct {
	Id         int64  `db:"id" json:"id"`
	UserId     string `db:"userId" json:"userId"`
	UserName   string `db:"userName" json:"userName"`
	Module     string `db:"module" json:"module"`
	Action     string `db:"action" json:"action"`
	TargetId   string `db:"targetId" json:"targetId"`
	Method     string `db:"method" json:"method"`
	Path       string `db:"path" json:"path"`
	Ip         string `db:"ip" json:"ip"`
	UserAgent  string `db:"userAgent" json:"userAgent"`
	ReqBody    string `db:"reqBody" json:"reqBody"`
	BeforeData string `db:"beforeData" json:"beforeData"`
	AfterData  string `db:"afterData" json:"afterData"`
	StatusCode int    `db:"statusCode" json:"statusCode"`
	// 1 成功 / 0 失败，与 tinyint(1) 对齐，前端按数字判断
	Success    int    `db:"success" json:"success"`
	ErrMsg     string `db:"errMsg" json:"errMsg"`
	CostMs     int    `db:"costMs" json:"costMs"`
	CreateTime string `db:"createTime" json:"createTime"`
}

const (
	// 队列容量，满了就丢，绝不阻塞 HTTP
	queueSize = 1024

	// reqBody 落库上限（spec：超过 4KB 截断）
	maxReqBodyBytes = 4096
	// 改前/改后快照上限。TEXT 列上限是 65535 字节，这里留足余量，
	// 保证加上「已截断」后缀后仍不会超列宽。
	maxSnapshotBytes = 32 * 1024
)

const insertSql = "insert into t_operation_log" +
	"(userId,userName,module,action,targetId,method,path,ip,userAgent," +
	"reqBody,beforeData,afterData,statusCode,success,errMsg,costMs,createTime) " +
	"values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"

// 字段宽度，按 DDL 截断，避免 MySQL 非严格模式静默截断 / 严格模式直接报错
const (
	maxUserId     = 40
	maxUserName   = 40
	maxModule     = 32
	maxAction     = 16
	maxTargetId   = 64
	maxMethod     = 10
	maxPath       = 255
	maxIp         = 64
	maxUserAgent  = 255
	maxErrMsg     = 500
	oplogLocalKey = "oplog_"
)

var (
	mu      sync.Mutex
	queue   chan *OperationLog
	started bool
	wg      sync.WaitGroup
	// 丢弃计数，仅用于日志观测
	dropped int64
)

// Start 启动异步写入器
//
// 重复调用是安全的（只会启动一次）。必须在 database.ConnectDB() 成功之后调用。
func Start() {
	mu.Lock()
	defer mu.Unlock()
	if started {
		return
	}
	queue = make(chan *OperationLog, queueSize)
	started = true
	wg.Add(1)
	go consume(queue)
	log.Printf("[操作日志] 异步写入器已启动，队列容量 %d", queueSize)
}

// Stop 停止写入器并尽量 flush
//
// 关闭 channel 后消费 goroutine 会把队列里剩余记录写完再退出，
// 因此调用方（main 的优雅关闭钩子）等待返回即代表「已尽量落库」。
func Stop() {
	mu.Lock()
	if !started {
		mu.Unlock()
		return
	}
	q := queue
	queue = nil
	started = false
	mu.Unlock()

	close(q)
	wg.Wait()

	if n := atomic.LoadInt64(&dropped); n > 0 {
		log.Printf("[操作日志] 运行期间因队列已满共丢弃 %d 条", n)
	}
	log.Println("[操作日志] 已停止，队列内记录已尽量写入")
}

func consume(ch chan *OperationLog) {
	defer wg.Done()
	for entry := range ch {
		write(entry)
	}
}

// write 落库；失败只打日志，不影响任何业务逻辑（此时业务响应早已返回）
func write(entry *OperationLog) {
	db := database.DBConn
	if db == nil {
		return
	}

	if entry.CreateTime == "" {
		entry.CreateTime = utils.GetNow()
	}

	_, err := db.Exec(insertSql,
		Clamp(entry.UserId, maxUserId),
		Clamp(entry.UserName, maxUserName),
		Clamp(entry.Module, maxModule),
		Clamp(entry.Action, maxAction),
		Clamp(entry.TargetId, maxTargetId),
		Clamp(entry.Method, maxMethod),
		Clamp(entry.Path, maxPath),
		Clamp(entry.Ip, maxIp),
		Clamp(entry.UserAgent, maxUserAgent),
		Clamp(entry.ReqBody, maxReqBodyBytes),
		Clamp(entry.BeforeData, maxSnapshotBytes),
		Clamp(entry.AfterData, maxSnapshotBytes),
		entry.StatusCode,
		entry.Success,
		Clamp(entry.ErrMsg, maxErrMsg),
		entry.CostMs,
		entry.CreateTime,
	)
	if err != nil {
		log.Println("[操作日志] 写入失败:", err)
	}
}

// Enqueue 投递一条日志，非阻塞；队列满时丢弃并计数
func Enqueue(entry *OperationLog) {
	if entry == nil {
		return
	}

	// 全程持锁：非阻塞发送代价极小，但能杜绝「Stop 关闭 channel 的同时还在发送」
	// 导致的 "send on closed channel" panic。
	mu.Lock()
	defer mu.Unlock()

	if queue == nil {
		// 未 Start（或已 Stop）：仍然丢弃（绝不影响业务），但必须计数 + 打日志，
		// 否则审计会「静默失效」，运维无从发现。
		n := atomic.AddInt64(&dropped, 1)
		if n == 1 || n%100 == 0 {
			log.Printf("[操作日志] 写入器未启动或已停止，已丢弃 %d 条", n)
		}
		return
	}

	select {
	case queue <- entry:
	default:
		n := atomic.AddInt64(&dropped, 1)
		if n == 1 || n%100 == 0 {
			log.Printf("[操作日志] 队列已满，已丢弃 %d 条", n)
		}
	}
}

// -----------------------------------------------------------------------------
// 业务 handler 埋点 helper
// -----------------------------------------------------------------------------

const (
	keyModule   = oplogLocalKey + "module"
	keyAction   = oplogLocalKey + "action"
	keyTargetId = oplogLocalKey + "targetId"
	keyBefore   = oplogLocalKey + "before"
	keyAfter    = oplogLocalKey + "after"
	keyError    = oplogLocalKey + "error"
	keyForce    = oplogLocalKey + "force"
)

// SetModule 覆盖由路径推导出的模块名（order/product/contact/stock/alarm/user/system/auth…）
func SetModule(c *fiber.Ctx, module string) {
	if c != nil {
		c.Locals(keyModule, module)
	}
}

// SetAction 覆盖由 HTTP 方法推导出的动作（create/update/delete/login/logout/other）
func SetAction(c *fiber.Ctx, action string) {
	if c != nil {
		c.Locals(keyAction, action)
	}
}

// SetTargetID 设置操作目标 ID（记录主键等）
func SetTargetID(c *fiber.Ctx, id interface{}) {
	if c == nil {
		return
	}
	if id == nil {
		return
	}
	c.Locals(keyTargetId, toString(id))
}

// SetSnapshot 设置改前/改后快照，会序列化成 JSON；不修改的传 nil
//
// 只应在 update / delete 的 handler 里调用（create 可只传 after）。
// 快照同样走请求体的脱敏规则（password/token/secret 等替换为 ***），
// 避免将来给账号类 handler 加快照时把明文密码写进审计表。
func SetSnapshot(c *fiber.Ctx, before, after interface{}) {
	if c == nil {
		return
	}
	if before != nil {
		if s := ToRedactedJSONString(before, maxSnapshotBytes); s != "" {
			c.Locals(keyBefore, s)
		}
	}
	if after != nil {
		if s := ToRedactedJSONString(after, maxSnapshotBytes); s != "" {
			c.Locals(keyAfter, s)
		}
	}
}

// SetError 覆盖失败原因（默认取响应体里的 message）
func SetError(c *fiber.Ctx, msg string) {
	if c != nil && msg != "" {
		c.Locals(keyError, msg)
	}
}

// ForceRecord 标记该请求必须记录
//
// 用于 GET 形式的导出类高危操作（默认 GET 不记录）。
func ForceRecord(c *fiber.Ctx) {
	if c != nil {
		c.Locals(keyForce, true)
	}
}

// ModuleOf 读取 handler 覆盖过的模块名
func ModuleOf(c *fiber.Ctx) string { return localString(c, keyModule) }

// ActionOf 读取 handler 覆盖过的动作
func ActionOf(c *fiber.Ctx) string { return localString(c, keyAction) }

// TargetIDOf 读取 handler 设置的目标 ID
func TargetIDOf(c *fiber.Ctx) string { return localString(c, keyTargetId) }

// BeforeOf 读取改前快照 JSON
func BeforeOf(c *fiber.Ctx) string { return localString(c, keyBefore) }

// AfterOf 读取改后快照 JSON
func AfterOf(c *fiber.Ctx) string { return localString(c, keyAfter) }

// ErrorOf 读取 handler 设置的错误信息
func ErrorOf(c *fiber.Ctx) string { return localString(c, keyError) }

// ForceRecordOf 是否被 handler 强制标记为需要记录
func ForceRecordOf(c *fiber.Ctx) bool {
	if c == nil {
		return false
	}
	v, ok := c.Locals(keyForce).(bool)
	return ok && v
}

func localString(c *fiber.Ctx, key string) string {
	if c == nil {
		return ""
	}
	if v, ok := c.Locals(key).(string); ok {
		return v
	}
	return ""
}

func toString(v interface{}) string {
	switch val := v.(type) {
	case string:
		return val
	case []byte:
		return string(val)
	case error:
		return val.Error()
	default:
		b, err := json.Marshal(val)
		if err != nil {
			return ""
		}
		// 数字/字符串会被序列化成 "1" / "abc"，去掉多余引号
		s := string(b)
		if len(s) >= 2 && s[0] == '"' && s[len(s)-1] == '"' {
			return s[1 : len(s)-1]
		}
		return s
	}
}

// -----------------------------------------------------------------------------
// 脱敏 / 截断
// -----------------------------------------------------------------------------

// 命中即脱敏的字段名关键字（小写包含匹配）
var sensitiveKeyParts = []string{
	"password", "passwd", "pwd", "token", "secret",
	"authcode", "authorization", "cookie", "privatekey",
}

// RedactJSON 把请求体脱敏后再序列化，非 JSON 内容退化为原样截断
func RedactJSON(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}

	var value interface{}
	if err := json.Unmarshal(raw, &value); err != nil {
		return Clamp(string(raw), maxReqBodyBytes)
	}

	sanitized, err := json.Marshal(redactValue(value))
	if err != nil {
		return ""
	}
	return Clamp(string(sanitized), maxReqBodyBytes)
}

func redactValue(value interface{}) interface{} {
	switch val := value.(type) {
	case map[string]interface{}:
		out := make(map[string]interface{}, len(val))
		for k, item := range val {
			if isSensitiveKey(k) {
				out[k] = "***"
				continue
			}
			out[k] = redactValue(item)
		}
		return out
	case []interface{}:
		out := make([]interface{}, len(val))
		for i, item := range val {
			out[i] = redactValue(item)
		}
		return out
	default:
		return val
	}
}

func isSensitiveKey(key string) bool {
	lower := strings.ToLower(key)
	for _, part := range sensitiveKeyParts {
		if strings.Contains(lower, part) {
			return true
		}
	}
	return false
}

// ToJSONString 把任意值序列化成 JSON 字符串并按上限截断
func ToJSONString(value interface{}, max int) string {
	b, err := json.Marshal(value)
	if err != nil {
		return ""
	}
	return Clamp(string(b), max)
}

// ToRedactedJSONString 序列化 -> 脱敏 -> 再序列化，并按上限截断。
//
// 用于改前/改后快照：结构体里可能带 password / mailAuthCode 这类字段，
// 快照和请求体一样必须在落库前脱敏。不是合法 JSON 时退化为普通序列化结果。
func ToRedactedJSONString(value interface{}, max int) string {
	b, err := json.Marshal(value)
	if err != nil {
		return ""
	}

	var decoded interface{}
	if err := json.Unmarshal(b, &decoded); err != nil {
		return Clamp(string(b), max)
	}

	sanitized, err := json.Marshal(redactValue(decoded))
	if err != nil {
		return Clamp(string(b), max)
	}
	return Clamp(string(sanitized), max)
}

const clampSuffix = "...(已截断)"

// Clamp 按字节上限截断，并在末尾标注「已截断」。
//
// 注意：截断标记也算在 max 之内。varchar 列（path/userAgent/errMsg…）若超列宽，
// MySQL 严格模式下会整条 insert 失败、丢掉这条审计记录，所以这里必须保证
// 返回值长度一定 ≤ max，而不是 max + 标记长度。
func Clamp(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	if keep := max - len(clampSuffix); keep > 0 {
		return Truncate(s, keep) + clampSuffix
	}
	return Truncate(s, max)
}

// Truncate 按字节上限硬截断，且保证结果仍是合法 UTF-8
// （MySQL utf8mb4 不接受半个汉字）。
func Truncate(s string, max int) string {
	if max <= 0 || len(s) <= max {
		return s
	}
	s = s[:max]
	for len(s) > 0 && !utf8.ValidString(s) {
		s = s[:len(s)-1]
	}
	return s
}
