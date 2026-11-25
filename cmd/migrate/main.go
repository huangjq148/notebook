// Command migrate 提供手动迁移和数据库维护命令。
//
// 用法：
//
//	migrate up                 升级到最新版本（幂等）
//	migrate down <目标版本>     回滚到目标版本（目标版本保留；0 表示全部回滚）
//	migrate status             查看已执行版本
//	migrate set-password <用户> 用 ADMIN_INIT_PASSWORD 重置指定账号密码（bcrypt）
//
// 连接参数复用 internal/config（环境变量优先，其次当前目录 .env），
// 不在代码或脚本中硬编码任何凭据。
package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"hjq-notebook/internal/config"
	"hjq-notebook/migrations"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "迁移失败:", err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		return usageError()
	}

	db, err := connect()
	if err != nil {
		return err
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	switch args[0] {
	case "up":
		return migrations.Up(ctx, db)
	case "down":
		if len(args) < 2 {
			return fmt.Errorf("down 需要目标版本，例如：migrate down 0")
		}
		return migrations.Down(ctx, db, args[1])
	case "status":
		return migrations.Status(ctx, db)
	case "set-password":
		if len(args) < 2 {
			return fmt.Errorf("set-password 需要用户名，例如：migrate set-password huangjq")
		}
		return setPassword(ctx, db, args[1])
	default:
		return usageError()
	}
}

func usageError() error {
	return fmt.Errorf("未知命令；支持 up、down <目标版本>、status、set-password <用户名>")
}

func connect() (*sql.DB, error) {
	host := strings.TrimSpace(config.Config("DB_HOST"))
	port := strings.TrimSpace(config.Config("DB_PORT"))
	user := strings.TrimSpace(config.Config("DB_USER"))
	password := config.Config("DB_PASSWORD")
	dbName := strings.TrimSpace(config.Config("DB_NAME"))

	if dbName == "" {
		return nil, fmt.Errorf("数据库配置错误: DB_NAME 未设置，请通过环境变量或 .env 指定目标数据库")
	}
	if host == "" {
		return nil, fmt.Errorf("数据库配置错误: DB_HOST 未设置")
	}
	if user == "" {
		return nil, fmt.Errorf("数据库配置错误: DB_USER 未设置")
	}
	if port == "" {
		port = "3306"
	}
	if _, err := strconv.Atoi(port); err != nil {
		return nil, fmt.Errorf("数据库配置错误: DB_PORT=%q 不是合法端口", port)
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=true&loc=Local&timeout=10s&readTimeout=60s&writeTimeout=60s",
		user, password, host, port, dbName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("打开数据库连接失败: %w", err)
	}
	db.SetMaxOpenConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("连接数据库失败（%s:%s/%s）: %w", host, port, dbName, err)
	}
	return db, nil
}

func setPassword(ctx context.Context, db *sql.DB, username string) error {
	password := os.Getenv("ADMIN_INIT_PASSWORD")
	if password == "" {
		password = os.Getenv("NEW_PASSWORD")
	}
	if password == "" {
		return fmt.Errorf("数据库配置错误: 请通过 ADMIN_INIT_PASSWORD（或 NEW_PASSWORD）提供新密码")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("生成密码哈希失败: %w", err)
	}
	result, err := db.ExecContext(ctx,
		"UPDATE `t_user_account` SET `password` = ? WHERE `username` = ?", string(hash), username)
	if err != nil {
		return fmt.Errorf("更新密码失败: %w", err)
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("账号 %s 不存在或新密码与旧密码相同，未更新", username)
	}
	fmt.Printf("已重置账号 %s 的密码（bcrypt），影响行数：%d\n", username, affected)
	return nil
}
