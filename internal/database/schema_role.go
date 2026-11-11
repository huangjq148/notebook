package database

import (
	"log"
	"strings"
	"sync/atomic"
)

// 角色（roles）列的探测与降级。
//
// 老库可能没有 t_user_account.roles 列（真实 DDL 里确实没有）。启动时探测一次并缓存：
//   - 探测到：登录 SQL 带 roles，JWT 写入 roles，操作日志按角色鉴权；
//   - 探测不到 / 探测失败：roles 一律视为 user → 操作日志对所有人 403，
//     并打醒目 warn 提示执行 migration.sql。
//
// 安全优先：宁可所有人都看不到审计日志，也不能因为角色信息缺失而放开访问。

const (
	// RoleColumnHint 恢复功能的提示文案（日志与 result.md 共用）
	RoleColumnHint = "请执行 migration.sql 添加 t_user_account.roles 列后重启服务"
)

var roleColumnReady int32

// EnsureRoleSupport 探测 t_user_account.roles 是否存在并缓存结果。
//
// 必须在 database.ConnectDB() 成功之后调用。任何失败都按「不可用」处理，
// 只打日志，绝不阻断启动。
func EnsureRoleSupport() bool {
	if detectRoleColumn() {
		atomic.StoreInt32(&roleColumnReady, 1)
		log.Println("[角色] 已检测到 t_user_account.roles，操作日志按角色鉴权（仅 admin 可访问）")
		return true
	}

	atomic.StoreInt32(&roleColumnReady, 0)
	log.Println("[角色] 未检测到 t_user_account.roles，操作日志已关闭访问（所有人 403），" + RoleColumnHint)
	return false
}

// RoleColumnReady 启动时的探测结果：roles 列是否可用
func RoleColumnReady() bool {
	return atomic.LoadInt32(&roleColumnReady) == 1
}

// MarkRoleColumnMissing 运行期发现列不存在时永久降级（例如列被 DROP）
func MarkRoleColumnMissing() {
	atomic.StoreInt32(&roleColumnReady, 0)
}

// IsUnknownColumnError 判断是否是 MySQL 1054 Unknown column 错误。
//
// 不直接依赖驱动类型（go-sql-driver 只是间接依赖），用错误文本判断即可。
func IsUnknownColumnError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "1054") || strings.Contains(strings.ToLower(msg), "unknown column")
}

func detectRoleColumn() bool {
	if DBConn == nil {
		return false
	}

	var count int
	err := DBConn.Get(&count,
		"select count(*) from information_schema.columns "+
			"where table_schema=database() and table_name='t_user_account' and column_name='roles'")
	if err != nil {
		log.Println("[warn] [角色] 探测 t_user_account.roles 失败，按「不存在」处理:", err)
		return false
	}
	return count > 0
}
