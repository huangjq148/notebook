package services

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"hjq-notebook/internal/config"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/utils"
)

// 数据同步邮件默认配置，可通过 .env 提供初始值，保存后会持久化到数据库。
const (
	defaultMailHost = "smtp.qq.com"
	defaultMailPort = "587"
	defaultSyncHour = 12
)

func envOrDefault(key, defaultValue string) string {
	if value := config.Config(key); value != "" {
		return value
	}
	return defaultValue
}

func envBoolToEnable(value string) string {
	if value == "true" || value == "1" {
		return "1"
	}
	return "0"
}

// EnsureDataSyncConfigTable 确保配置表存在
func EnsureDataSyncConfigTable() error {
	sql := `
CREATE TABLE IF NOT EXISTS t_data_sync_config (
  id int NOT NULL AUTO_INCREMENT,
  isEnable varchar(1) DEFAULT '0',
  mailUsername varchar(100) DEFAULT NULL,
  mailAuthCode varchar(100) DEFAULT NULL,
  mailFrom varchar(100) DEFAULT NULL,
  mailTo varchar(100) DEFAULT NULL,
  mailHost varchar(100) DEFAULT 'smtp.qq.com',
  mailPort varchar(10) DEFAULT '587',
  sendHour int DEFAULT 12,
  updateTime varchar(20) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`

	_, err := database.DBConn.Exec(sql)
	return err
}

// defaultDataSyncConfig 数据库无配置时，使用 .env 作为默认值
func defaultDataSyncConfig() model.DataSyncConfig {
	hour := defaultSyncHour
	if value := config.Config("SYNC_MAIL_HOUR"); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed >= 0 && parsed <= 23 {
			hour = parsed
		}
	}

	return model.DataSyncConfig{
		IsEnable:     envBoolToEnable(config.Config("SYNC_MAIL_ENABLE")),
		MailUsername: config.Config("SYNC_MAIL_USERNAME"),
		MailAuthCode: config.Config("SYNC_MAIL_AUTH_CODE"),
		MailFrom:     config.Config("SYNC_MAIL_FROM"),
		MailTo:       config.Config("SYNC_MAIL_TO"),
		MailHost:     envOrDefault("SYNC_MAIL_HOST", defaultMailHost),
		MailPort:     envOrDefault("SYNC_MAIL_PORT", defaultMailPort),
		SendHour:     hour,
	}
}

// LoadDataSyncConfig 读取配置，不存在时返回 .env 默认值
func LoadDataSyncConfig() (model.DataSyncConfig, error) {
	var cfg model.DataSyncConfig

	err := database.DBConn.Get(&cfg,
		"select id,isEnable,mailUsername,mailAuthCode,mailFrom,mailTo,mailHost,mailPort,sendHour,updateTime from t_data_sync_config where id=1")
	if err == sql.ErrNoRows {
		return defaultDataSyncConfig(), nil
	}
	if err != nil {
		return cfg, err
	}

	if cfg.MailHost == "" {
		cfg.MailHost = defaultMailHost
	}
	if cfg.MailPort == "" {
		cfg.MailPort = defaultMailPort
	}
	if cfg.SendHour < 0 || cfg.SendHour > 23 {
		cfg.SendHour = defaultSyncHour
	}

	return cfg, nil
}

// SaveDataSyncConfig 保存配置（单条记录）
//
// 传入的 MailAuthCode 为空时表示不修改已保存的授权码。
func SaveDataSyncConfig(cfg model.DataSyncConfig) error {
	db := database.DBConn
	now := utils.GetNow()

	var count int
	if err := db.Get(&count, "select count(1) from t_data_sync_config where id=1"); err != nil {
		return err
	}

	if count == 0 {
		_, err := db.Exec(
			`insert into t_data_sync_config(id,isEnable,mailUsername,mailAuthCode,mailFrom,mailTo,mailHost,mailPort,sendHour,updateTime)
			 values(1,?,?,?,?,?,?,?,?,?)`,
			cfg.IsEnable, cfg.MailUsername, cfg.MailAuthCode, cfg.MailFrom, cfg.MailTo,
			cfg.MailHost, cfg.MailPort, cfg.SendHour, now,
		)
		return err
	}

	if cfg.MailAuthCode == "" {
		_, err := db.Exec(
			`update t_data_sync_config set isEnable=?,mailUsername=?,mailFrom=?,mailTo=?,mailHost=?,mailPort=?,sendHour=?,updateTime=? where id=1`,
			cfg.IsEnable, cfg.MailUsername, cfg.MailFrom, cfg.MailTo,
			cfg.MailHost, cfg.MailPort, cfg.SendHour, now,
		)
		return err
	}

	_, err := db.Exec(
		`update t_data_sync_config set isEnable=?,mailUsername=?,mailAuthCode=?,mailFrom=?,mailTo=?,mailHost=?,mailPort=?,sendHour=?,updateTime=? where id=1`,
		cfg.IsEnable, cfg.MailUsername, cfg.MailAuthCode, cfg.MailFrom, cfg.MailTo,
		cfg.MailHost, cfg.MailPort, cfg.SendHour, now,
	)
	return err
}

func mailConfigFromDataSync(cfg model.DataSyncConfig) MailConfig {
	return MailConfig{
		Host:     cfg.MailHost,
		Port:     cfg.MailPort,
		Username: cfg.MailUsername,
		Password: cfg.MailAuthCode,
		From:     cfg.MailFrom,
		To:       cfg.MailTo,
	}
}

// sendDataSyncMailWithConfig 使用指定配置导出整个数据库并发送备份
func sendDataSyncMailWithConfig(cfg model.DataSyncConfig) error {
	content, err := BuildExportCSV()
	if err != nil {
		return err
	}

	now := time.Now()
	filename := fmt.Sprintf("data-sync-%s.csv", now.Format("20060102-150405"))
	subject := fmt.Sprintf("数据同步备份 %s", now.Format("2006-01-02"))
	body := fmt.Sprintf("附件为系统自动生成的数据备份，请妥善保存。\n导出时间：%s", now.Format("2006-01-02 15:04:05"))

	return SendMailWithAttachment(mailConfigFromDataSync(cfg), subject, body, filename, content)
}
