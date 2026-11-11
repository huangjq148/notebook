package services

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"hjq-notebook/internal/config"
	"hjq-notebook/internal/database"
)

// 操作日志保留期清理
//
// 保留天数取环境变量 OPLOG_RETENTION_DAYS，默认 180 天；设为 0 表示永久保留（不清理）。
// 每天跑一次（启动时先跑一次，便于清理积压），写法和 StartDataSyncMailScheduler 保持一致。

const defaultOperationLogRetentionDays = 180

// OperationLogRetentionDays 读取保留天数配置
func OperationLogRetentionDays() int {
	raw := strings.TrimSpace(config.Config("OPLOG_RETENTION_DAYS"))
	if raw == "" {
		return defaultOperationLogRetentionDays
	}

	days, err := strconv.Atoi(raw)
	if err != nil || days < 0 {
		log.Printf("[操作日志] OPLOG_RETENTION_DAYS=%q 不合法，按默认 %d 天处理", raw, defaultOperationLogRetentionDays)
		return defaultOperationLogRetentionDays
	}
	return days
}

// CleanupOperationLogs 删除超过保留期的操作日志，返回删除行数
//
// 保留天数为 0 时直接返回 0，不清空历史。
func CleanupOperationLogs() (int64, error) {
	days := OperationLogRetentionDays()
	if days == 0 {
		return 0, nil
	}

	if database.DBConn == nil {
		return 0, fmt.Errorf("数据库未连接")
	}

	cutoff := time.Now().AddDate(0, 0, -days).Format("2006-01-02 15:04:05")
	result, err := database.DBConn.Exec("delete from t_operation_log where createTime is not null and createTime < ?", cutoff)
	if err != nil {
		return 0, err
	}

	affected, _ := result.RowsAffected()
	return affected, nil
}

// StartOperationLogCleanupScheduler 启动每日清理任务
//
// 保留天数为 0 时不启动任何 goroutine（永久保留）。
func StartOperationLogCleanupScheduler() {
	days := OperationLogRetentionDays()
	if days == 0 {
		log.Println("[操作日志] OPLOG_RETENTION_DAYS=0，历史日志永久保留，清理任务未启动")
		return
	}

	log.Printf("[操作日志] 清理任务已启动，保留 %d 天，每天 03:00 执行", days)

	runOnce := func() {
		affected, err := CleanupOperationLogs()
		if err != nil {
			log.Println("[操作日志] 清理失败:", err)
			return
		}
		if affected > 0 {
			log.Printf("[操作日志] 已清理 %d 条早于 %d 天前的记录", affected, days)
		}
	}

	go func() {
		// 启动即跑一次，清掉停机期间积压的过期数据
		runOnce()

		var lastRunDate string
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			// 每小时醒一次，命中 03:00 且当天没跑过才执行
			now := time.Now()
			if now.Hour() != 3 {
				continue
			}

			date := now.Format("2006-01-02")
			if lastRunDate == date {
				continue
			}
			lastRunDate = date

			runOnce()
		}
	}()
}
