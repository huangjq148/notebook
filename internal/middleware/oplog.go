package middleware

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"hjq-notebook/internal/oplog"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// OperationLog 操作日志（审计日志）中间件
//
// 挂在 /api 分组上（在 Protected() 之前），因此能观察到「还没登录成功」的登录请求。
// 它只负责通用字段，业务语义由 handler 通过 oplog.SetXxx 补充。
//
// 不阻塞业务：抓完数据后丢进 oplog 的缓冲 channel，写库在独立 goroutine 里做。
func OperationLog() fiber.Handler {
	return func(c *fiber.Ctx) error {
		path := c.Path()

		// 操作日志自身的接口不记录，避免自记录
		if !isApiPath(path) || strings.HasPrefix(path, "/api/operation-log") {
			return c.Next()
		}

		start := time.Now()
		method := c.Method()
		trackWrite := isWriteMethod(method)
		isLogin := isLoginPath(path)

		// 请求体必须在 c.Next() 之前取（handler 可能已经解析/消费）。
		// 只读请求默认不开销这部分读取。
		reqBody := ""
		if trackWrite || isLogin {
			reqBody = readRequestBody(c)
		}

		nextErr := c.Next()

		// 只读请求默认不记录；导出这类高危 GET 由 handler 用 oplog.ForceRecord 标记
		if !trackWrite && !isLogin && !oplog.ForceRecordOf(c) {
			return nextErr
		}

		entry := &oplog.OperationLog{
			Method:    method,
			Path:      path,
			Ip:        c.IP(),
			UserAgent: c.Get(fiber.HeaderUserAgent),
			ReqBody:   reqBody,
			Module:    moduleFromPath(path),
			Action:    actionFromPath(method, path),
			TargetId:  targetIdFromPath(path),
		}

		finish(c, entry, start, nextErr)
		return nextErr
	}
}

// finish 汇总响应结果、身份信息与 handler 埋点，然后异步落库
func finish(c *fiber.Ctx, entry *oplog.OperationLog, start time.Time, nextErr error) {
	statusCode := c.Response().StatusCode()
	success := statusCode < fiber.StatusBadRequest
	errMsg := ""

	// 本项目业务失败也是 HTTP 200 + {"status":"error"}，需要看响应体
	if body := c.Response().Body(); len(body) > 0 && len(body) <= 128*1024 {
		var result struct {
			Status  string `json:"status"`
			Message string `json:"message"`
		}
		if json.Unmarshal(body, &result) == nil {
			if result.Status == "error" || result.Status == "fail" {
				success = false
			}
			if !success {
				errMsg = result.Message
			}
		}
	}

	if nextErr != nil {
		success = false
		if errMsg == "" {
			errMsg = nextErr.Error()
		}
	}

	// handler 埋点覆盖默认推导值
	if v := oplog.ModuleOf(c); v != "" {
		entry.Module = v
	}
	if v := oplog.ActionOf(c); v != "" {
		entry.Action = v
	}
	if v := oplog.TargetIDOf(c); v != "" {
		entry.TargetId = v
	}
	if v := oplog.ErrorOf(c); v != "" {
		errMsg = v
	}
	entry.BeforeData = oplog.BeforeOf(c)
	entry.AfterData = oplog.AfterOf(c)

	// 身份必须在 c.Next() 之后取：middleware.User 是在内层链里写入的
	entry.UserId, entry.UserName = identityOf(c)

	entry.StatusCode = statusCode
	entry.Success = boolToInt(success)
	entry.ErrMsg = errMsg
	entry.CostMs = int(time.Since(start).Milliseconds())
	entry.CreateTime = utils.GetNow()

	oplog.Enqueue(entry)
}

// identityOf 取操作人：userId 来自 middleware.User / JWT，userName 来自 JWT 或登录请求体
//
// 刻意不做 DB 查询，避免为审计日志给每个写请求多加一次数据库往返。
func identityOf(c *fiber.Ctx) (string, string) {
	var userId, userName string

	// middleware.User() 会把 token 里的 user_id 塞进请求头 current_user_id
	userId = c.Get("current_user_id")

	if token := c.Get(fiber.HeaderAuthorization); token != "" {
		if claims, err := utils.ParseToken(token); err == nil {
			if v, ok := claims["username"].(string); ok {
				userName = v
			}
			if userId == "" {
				if v, ok := claims["user_id"].(string); ok {
					userId = v
				}
			}
		}
	}

	// 登录请求进入时还没有 token：用户名从请求体拿（失败也要能追踪撞库来源），
	// 登录成功后再从响应体补上 userId，这样「谁登录成功」也能追溯到人。
	if isLoginPath(c.Path()) {
		if userName == "" {
			var body struct {
				Username string `json:"username"`
			}
			if json.Unmarshal(c.Body(), &body) == nil {
				userName = body.Username
			}
		}

		if userId == "" {
			var result struct {
				Data struct {
					UserId string `json:"userId"`
				} `json:"data"`
			}
			if json.Unmarshal(c.Response().Body(), &result) == nil {
				userId = result.Data.UserId
			}
		}
	}

	return userId, userName
}

// readRequestBody 读取并脱敏请求体
//
// 文件上传（multipart）只记类型，不读内容，避免把 32MB 的 csv 塞进日志或截断成乱码。
func readRequestBody(c *fiber.Ctx) string {
	contentType := strings.ToLower(string(c.Request().Header.ContentType()))
	if strings.HasPrefix(contentType, "multipart/form-data") {
		return "[multipart/form-data] 文件上传，内容不记录"
	}

	body := c.Body()
	if len(body) == 0 {
		return ""
	}
	return oplog.RedactJSON(body)
}

func isApiPath(path string) bool {
	return path == "/api" || strings.HasPrefix(path, "/api/")
}

func isLoginPath(path string) bool {
	return strings.HasSuffix(strings.ToLower(path), "/auth/login")
}

func isWriteMethod(method string) bool {
	switch method {
	case fiber.MethodPost, fiber.MethodPatch, fiber.MethodPut, fiber.MethodDelete:
		return true
	}
	return false
}

// moduleFromPath 由第一段路径推导模块名
func moduleFromPath(path string) string {
	segments := splitPath(path)
	if len(segments) < 2 {
		return ""
	}

	switch segments[1] {
	case "student-work":
		return "studentWork"
	case "operation-log":
		return "operationLog"
	default:
		return segments[1]
	}
}

// actionFromPath 由 HTTP 方法推导动作，登录单独处理
func actionFromPath(method, path string) string {
	if strings.HasPrefix(path, "/api/auth/") {
		if isLoginPath(path) {
			return "login"
		}
		return "other"
	}

	switch method {
	case fiber.MethodPost:
		return "create"
	case fiber.MethodPatch, fiber.MethodPut:
		return "update"
	case fiber.MethodDelete:
		return "delete"
	default:
		return "other"
	}
}

// targetIdFromPath 取路径里第一个纯数字段作为目标 ID（handler 可覆盖）
//
// 例：/api/order/12/status/1 -> 12，/api/order/revoke/stock/9 -> 9
func targetIdFromPath(path string) string {
	segments := splitPath(path)
	for i := 2; i < len(segments); i++ {
		if _, err := strconv.Atoi(segments[i]); err == nil {
			return segments[i]
		}
	}
	return ""
}

func splitPath(path string) []string {
	parts := strings.Split(path, "/")
	segments := make([]string, 0, len(parts))
	for _, part := range parts {
		if part != "" {
			segments = append(segments, part)
		}
	}
	return segments
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}
