package services

import (
	"fmt"
	"log"
	"time"
)

// RunDataSyncMail 使用数据库中的邮件配置，导出整个数据库并发送到配置的邮箱
func RunDataSyncMail() error {
	cfg, err := LoadDataSyncConfig()
	if err != nil {
		return fmt.Errorf("读取邮件配置失败: %w", err)
	}

	if !mailConfigFromDataSync(cfg).Enabled() {
		return fmt.Errorf("邮件配置不完整，请先在设置中完善邮箱信息")
	}

	return sendDataSyncMailWithConfig(cfg)
}

// StartDataSyncMailScheduler 启动定时任务，按数据库配置每天定时发送备份
//
// 配置可以在设置页随时修改，无需重启服务。
func StartDataSyncMailScheduler() {
	if err := EnsureDataSyncConfigTable(); err != nil {
		log.Println("[数据同步邮件] 初始化配置表失败:", err)
		return
	}

	log.Println("[数据同步邮件] 定时任务已启动，按数据库配置执行")

	go func() {
		var lastRunDate string
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			cfg, err := LoadDataSyncConfig()
			if err != nil {
				log.Println("[数据同步邮件] 读取配置失败:", err)
				continue
			}

			if cfg.IsEnable != "1" {
				continue
			}

			now := time.Now()
			if now.Hour() != cfg.SendHour || now.Minute() != 0 {
				continue
			}

			date := now.Format("2006-01-02")
			if lastRunDate == date {
				continue
			}
			lastRunDate = date

			if err := sendDataSyncMailWithConfig(cfg); err != nil {
				log.Println("[数据同步邮件] 发送失败:", err)
			} else {
				log.Println("[数据同步邮件] 发送成功")
			}
		}
	}()
}
