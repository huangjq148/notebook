package database

import "fmt"

// 操作日志（审计日志）表。
//
// 与 schema.go 的兜底建表保持同一套约定：MySQL 语法、表名 t_*、字段驼峰、
// 时间字段用 varchar(20) 存 "YYYY-MM-DD HH:mm:ss" 字符串。
// 单独成文件是为了不碰 schema.go（那里有他人在途改动）。
const operationLogTable = "CREATE TABLE IF NOT EXISTS `t_operation_log` (" +
	"`id` bigint NOT NULL AUTO_INCREMENT," +
	"`userId` varchar(40) DEFAULT NULL," +
	"`userName` varchar(40) DEFAULT NULL," +
	"`module` varchar(32) DEFAULT NULL," +
	"`action` varchar(16) DEFAULT NULL," +
	"`targetId` varchar(64) DEFAULT NULL," +
	"`method` varchar(10) DEFAULT NULL," +
	"`path` varchar(255) DEFAULT NULL," +
	"`ip` varchar(64) DEFAULT NULL," +
	"`userAgent` varchar(255) DEFAULT NULL," +
	"`reqBody` text," +
	"`beforeData` text," +
	"`afterData` text," +
	"`statusCode` int DEFAULT NULL," +
	"`success` tinyint(1) DEFAULT 1," +
	"`errMsg` varchar(500) DEFAULT NULL," +
	"`costMs` int DEFAULT NULL," +
	"`createTime` varchar(20) DEFAULT NULL," +
	"PRIMARY KEY (`id`)," +
	"KEY `idx_createTime` (`createTime`)," +
	"KEY `idx_userId` (`userId`)," +
	"KEY `idx_module` (`module`)," +
	"KEY `idx_action` (`action`)" +
	") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"

// EnsureOperationLogSchema 确保操作日志表存在。
//
// 在 main.go 中于 ConnectDB() 成功之后调用；失败只由调用方打 warn，不 panic，
// 也不会影响其它业务表。
func EnsureOperationLogSchema() error {
	if DBConn == nil {
		return fmt.Errorf("database not connected")
	}

	if _, err := DBConn.Exec(operationLogTable); err != nil {
		return fmt.Errorf("创建 t_operation_log 失败: %w", err)
	}
	return nil
}
