package api

import (
	"strconv"
	"strings"
	"time"

	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/oplog"

	"github.com/gofiber/fiber/v2"
)

// 操作日志查询接口
//
// 说明：t_operation_log 是全局日志表，没有 createUser 字段，
// 因此这里不复用 database.QueryPage（它强制按 createUser 过滤），而是手写 SQL。

const (
	// 列表页只查这些轻量列，reqBody / beforeData / afterData 留到详情接口再取
	operationLogListColumns     = "id,userId,userName,module,action,targetId,method,path,ip,userAgent,statusCode,success,errMsg,costMs,createTime"
	defaultOperationLogPageSize = 20
	maxOperationLogPageSize     = 200
)

// QueryOperationLogList 分页查询操作日志
//
// 查询参数：page/current（默认 1）、pageSize（默认 20，最大 200）、module、action、
// userId、keyword（匹配 userName/targetId/path）、startTime、endTime（YYYY-MM-DD HH:mm:ss）
func QueryOperationLogList(c *fiber.Ctx) error {
	if database.DBConn == nil {
		return c.JSON(response.Error("数据库未连接"))
	}

	pageSize := parseInt(c.Query("pageSize"), defaultOperationLogPageSize)
	if pageSize <= 0 {
		pageSize = defaultOperationLogPageSize
	}
	if pageSize > maxOperationLogPageSize {
		pageSize = maxOperationLogPageSize
	}

	// 兼容项目既有前端（hooks/useTable 传 current）与 spec（传 page）
	page := parseInt(c.Query("current"), 0)
	if page <= 0 {
		page = parseInt(c.Query("page"), 1)
	}
	if page <= 0 {
		page = 1
	}

	whereSql, whereArgs := buildOperationLogWhere(c)

	list := []oplog.OperationLog{}
	listSql := "select " + operationLogListColumns + " from t_operation_log" + whereSql +
		" order by createTime desc, id desc limit ? offset ?"
	listArgs := append(append([]interface{}{}, whereArgs...), pageSize, (page-1)*pageSize)

	if err := database.DBConn.Select(&list, listSql, listArgs...); err != nil {
		return c.JSON(response.Error("查询失败: " + err.Error()))
	}

	total := 0
	countSql := "select count(1) from t_operation_log" + whereSql
	if err := database.DBConn.Get(&total, countSql, whereArgs...); err != nil {
		return c.JSON(response.Error("统计失败: " + err.Error()))
	}

	return c.JSON(response.Success(fiber.Map{
		"content":  list,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	}, "查询成功"))
}

// GetOperationLogById 查询单条操作日志详情（含改前/改后完整 JSON）
func GetOperationLogById(c *fiber.Ctx) error {
	if database.DBConn == nil {
		return c.JSON(response.Error("数据库未连接"))
	}

	id := c.Params("id")
	if _, err := strconv.ParseInt(id, 10, 64); err != nil {
		return c.JSON(response.Error("id 错误"))
	}

	var item oplog.OperationLog
	if err := database.DBConn.Get(&item, "select * from t_operation_log where id=?", id); err != nil {
		return c.JSON(response.Error("查找不到数据"))
	}

	return c.JSON(response.Success(item, "查询成功"))
}

// QueryOperationLogOptions 返回筛选用的模块 / 动作枚举
func QueryOperationLogOptions(c *fiber.Ctx) error {
	modules := []fiber.Map{
		{"value": "order", "label": "订单"},
		{"value": "product", "label": "商品"},
		{"value": "contact", "label": "联系人"},
		{"value": "stock", "label": "库存"},
		{"value": "alarm", "label": "定时提醒"},
		{"value": "user", "label": "用户"},
		{"value": "system", "label": "系统（数据同步）"},
		{"value": "auth", "label": "登录"},
		{"value": "studentWork", "label": "作业"},
		{"value": "calculator", "label": "计算题"},
	}

	actions := []fiber.Map{
		{"value": "create", "label": "新增"},
		{"value": "update", "label": "修改"},
		{"value": "delete", "label": "删除"},
		{"value": "login", "label": "登录"},
		{"value": "logout", "label": "退出"},
		{"value": "other", "label": "其他"},
	}

	return c.JSON(response.Success(fiber.Map{
		"module": modules,
		"action": actions,
	}, "查询成功"))
}

// buildOperationLogWhere 组装筛选条件，非法参数静默忽略（兜底，不报错）
func buildOperationLogWhere(c *fiber.Ctx) (string, []interface{}) {
	conditions := make([]string, 0, 6)
	args := make([]interface{}, 0, 8)

	if v := strings.TrimSpace(c.Query("module")); v != "" {
		conditions = append(conditions, "module=?")
		args = append(args, v)
	}

	if v := strings.TrimSpace(c.Query("action")); v != "" {
		conditions = append(conditions, "action=?")
		args = append(args, v)
	}

	if v := strings.TrimSpace(c.Query("userId")); v != "" {
		conditions = append(conditions, "userId=?")
		args = append(args, v)
	}

	if v := strings.TrimSpace(c.Query("keyword")); v != "" {
		conditions = append(conditions, "(userName like ? or targetId like ? or path like ?)")
		like := "%" + v + "%"
		args = append(args, like, like, like)
	}

	if v := normalizeOperationLogTime(c.Query("startTime"), false); v != "" {
		conditions = append(conditions, "createTime >= ?")
		args = append(args, v)
	}

	if v := normalizeOperationLogTime(c.Query("endTime"), true); v != "" {
		conditions = append(conditions, "createTime <= ?")
		args = append(args, v)
	}

	if len(conditions) == 0 {
		return "", args
	}
	return " where " + strings.Join(conditions, " and "), args
}

// normalizeOperationLogTime 校验并补全时间，非法格式返回空串（即忽略该条件）
//
// createTime 是 varchar(20)，字符串比较即可；只给日期时按当天起止时间补全。
func normalizeOperationLogTime(value string, isEnd bool) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	if _, err := time.Parse("2006-01-02 15:04:05", value); err == nil {
		return value
	}

	if _, err := time.Parse("2006-01-02", value); err == nil {
		if isEnd {
			return value + " 23:59:59"
		}
		return value + " 00:00:00"
	}

	return ""
}

// parseInt 解析整数，失败或为空时返回默认值
func parseInt(value string, defaultValue int) int {
	value = strings.TrimSpace(value)
	if value == "" {
		return defaultValue
	}
	result, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return result
}
