// Command migrate 是项目统一的数据库版本化迁移入口。
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
	"crypto/rand"
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"hjq-notebook/internal/config"
	"hjq-notebook/migrations"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

const adminHashPlaceholder = "{{ADMIN_INIT_PASSWORD_HASH}}"

var migrationFilePattern = regexp.MustCompile(`^([0-9]+)_([A-Za-z0-9_-]+)\.(up|down)\.sql$`)

type migration struct {
	Version     string
	Description string
	UpSQL       string
	DownSQL     string
}

type runner struct {
	db *sql.DB
}

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

	r := &runner{db: db}
	if err := r.ensureVersionTable(ctx); err != nil {
		return err
	}

	switch args[0] {
	case "up":
		return r.up(ctx)
	case "down":
		if len(args) < 2 {
			return fmt.Errorf("down 需要目标版本，例如：migrate down 0")
		}
		return r.down(ctx, args[1])
	case "status":
		return r.status(ctx)
	case "set-password":
		if len(args) < 2 {
			return fmt.Errorf("set-password 需要用户名，例如：migrate set-password huangjq")
		}
		return r.setPassword(ctx, args[1])
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

func (r *runner) ensureVersionTable(ctx context.Context) error {
	const ddl = "CREATE TABLE IF NOT EXISTS `schema_migrations` (" +
		"`version` varchar(64) NOT NULL," +
		"`description` varchar(255) NOT NULL DEFAULT ''," +
		"`applied_at` varchar(19) NOT NULL," +
		"PRIMARY KEY (`version`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
	if _, err := r.db.ExecContext(ctx, ddl); err != nil {
		return fmt.Errorf("创建 schema_migrations 表失败: %w", err)
	}
	return nil
}

func (r *runner) appliedVersions(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT `version` FROM `schema_migrations` ORDER BY `version`")
	if err != nil {
		return nil, fmt.Errorf("读取已执行版本失败: %w", err)
	}
	defer rows.Close()

	var versions []string
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		versions = append(versions, v)
	}
	return versions, rows.Err()
}

func loadMigrations() ([]migration, error) {
	entries, err := migrations.FS.ReadDir(".")
	if err != nil {
		return nil, fmt.Errorf("读取内嵌迁移脚本失败: %w", err)
	}

	byVersion := map[string]*migration{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		match := migrationFilePattern.FindStringSubmatch(name)
		if match == nil {
			continue
		}
		content, err := migrations.FS.ReadFile(name)
		if err != nil {
			return nil, fmt.Errorf("读取迁移脚本 %s 失败: %w", name, err)
		}
		m := byVersion[match[1]]
		if m == nil {
			m = &migration{Version: match[1], Description: match[2]}
			byVersion[match[1]] = m
		}
		switch match[3] {
		case "up":
			m.UpSQL = string(content)
		case "down":
			m.DownSQL = string(content)
		}
	}

	result := make([]migration, 0, len(byVersion))
	for _, m := range byVersion {
		if strings.TrimSpace(m.UpSQL) == "" {
			return nil, fmt.Errorf("迁移版本 %s 缺少 up 脚本", m.Version)
		}
		result = append(result, *m)
	}
	sort.Slice(result, func(i, j int) bool {
		return versionLess(result[i].Version, result[j].Version)
	})
	return result, nil
}

func versionLess(a, b string) bool {
	ai, aerr := strconv.Atoi(a)
	bi, berr := strconv.Atoi(b)
	if aerr == nil && berr == nil {
		return ai < bi
	}
	return a < b
}

func (r *runner) up(ctx context.Context) error {
	all, err := loadMigrations()
	if err != nil {
		return err
	}
	applied, err := r.appliedVersions(ctx)
	if err != nil {
		return err
	}
	appliedSet := map[string]bool{}
	for _, v := range applied {
		appliedSet[v] = true
	}

	pending := make([]migration, 0, len(all))
	for _, m := range all {
		if !appliedSet[m.Version] {
			pending = append(pending, m)
		}
	}
	if len(pending) == 0 {
		fmt.Printf("已是最新版本（当前版本：%s），无需迁移\n", blankIfEmpty(strings.Join(applied, ",")))
		return nil
	}

	conn, err := r.db.Conn(ctx)
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %w", err)
	}
	defer conn.Close()

	for _, m := range pending {
		hash, err := r.resolveAdminHash(ctx, conn, m.UpSQL)
		if err != nil {
			return err
		}
		affected, err := execScript(ctx, conn, m.UpSQL, hash)
		if err != nil {
			return fmt.Errorf("执行迁移 %s（%s）失败: %w", m.Version, m.Description, err)
		}
		if _, err := conn.ExecContext(ctx,
			"INSERT INTO `schema_migrations` (`version`,`description`,`applied_at`) VALUES (?,?,?)",
			m.Version, m.Description, time.Now().Format("2006-01-02 15:04:05")); err != nil {
			return fmt.Errorf("记录迁移版本 %s 失败: %w", m.Version, err)
		}
		fmt.Printf("已应用迁移 %s（%s），影响行数：%d\n", m.Version, m.Description, affected)
	}
	return r.printStatus(ctx)
}

func (r *runner) down(ctx context.Context, target string) error {
	all, err := loadMigrations()
	if err != nil {
		return err
	}
	byVersion := map[string]migration{}
	for _, m := range all {
		byVersion[m.Version] = m
	}

	applied, err := r.appliedVersions(ctx)
	if err != nil {
		return err
	}
	if target != "0" && !containsVersion(applied, target) {
		return fmt.Errorf("目标版本 %s 不在已执行版本中（已执行：%s）", target, blankIfEmpty(strings.Join(applied, ",")))
	}

	sort.Slice(applied, func(i, j int) bool {
		return versionLess(applied[j], applied[i])
	})

	conn, err := r.db.Conn(ctx)
	if err != nil {
		return fmt.Errorf("获取数据库连接失败: %w", err)
	}
	defer conn.Close()

	rolledBack := 0
	for _, version := range applied {
		if target != "0" && !versionLess(target, version) {
			continue
		}
		m, ok := byVersion[version]
		if !ok {
			return fmt.Errorf("找不到版本 %s 的迁移定义", version)
		}
		if strings.TrimSpace(m.DownSQL) == "" {
			return fmt.Errorf("迁移版本 %s 缺少 down 脚本", version)
		}
		hash, err := r.resolveAdminHash(ctx, conn, m.DownSQL)
		if err != nil {
			return err
		}
		affected, err := execScript(ctx, conn, m.DownSQL, hash)
		if err != nil {
			return fmt.Errorf("回滚迁移 %s（%s）失败: %w", version, m.Description, err)
		}
		if _, err := conn.ExecContext(ctx,
			"DELETE FROM `schema_migrations` WHERE `version` = ?", version); err != nil {
			return fmt.Errorf("删除迁移版本记录 %s 失败: %w", version, err)
		}
		rolledBack++
		fmt.Printf("已回滚迁移 %s（%s），影响行数：%d\n", version, m.Description, affected)
	}
	if rolledBack == 0 {
		fmt.Printf("目标版本 %s 已满足，无需回滚\n", target)
	}
	return r.printStatus(ctx)
}

func (r *runner) status(ctx context.Context) error {
	return r.printStatus(ctx)
}

func (r *runner) printStatus(ctx context.Context) error {
	versions, err := r.appliedVersions(ctx)
	if err != nil {
		return err
	}
	fmt.Printf("当前已执行版本：%s\n", blankIfEmpty(strings.Join(versions, ",")))
	return nil
}

func (r *runner) setPassword(ctx context.Context, username string) error {
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
	result, err := r.db.ExecContext(ctx,
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

// resolveAdminHash 为包含占位符的脚本生成 bcrypt 哈希。
//
// 只有确实需要创建 huangjq 时才强制要求 ADMIN_INIT_PASSWORD；
// 老库已有该账号时使用随机占位哈希（INSERT 不会执行），避免无谓地要求密钥。
func (r *runner) resolveAdminHash(ctx context.Context, conn *sql.Conn, script string) (string, error) {
	if !strings.Contains(script, adminHashPlaceholder) {
		return "", nil
	}

	password := os.Getenv("ADMIN_INIT_PASSWORD")
	if password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return "", fmt.Errorf("生成管理员密码哈希失败: %w", err)
		}
		return string(hash), nil
	}

	exists, err := accountExists(ctx, conn, "huangjq")
	if err != nil {
		return "", err
	}
	if exists {
		random := make([]byte, 32)
		if _, err := rand.Read(random); err != nil {
			return "", fmt.Errorf("生成随机占位密码失败: %w", err)
		}
		hash, err := bcrypt.GenerateFromPassword(random, bcrypt.DefaultCost)
		if err != nil {
			return "", fmt.Errorf("生成占位密码哈希失败: %w", err)
		}
		return string(hash), nil
	}
	return "", fmt.Errorf("数据库配置错误: 需要创建管理员 huangjq 时必须设置 ADMIN_INIT_PASSWORD")
}

func accountExists(ctx context.Context, conn *sql.Conn, username string) (bool, error) {
	var tableCount int
	if err := conn.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='t_user_account'").
		Scan(&tableCount); err != nil {
		return false, fmt.Errorf("检查 t_user_account 是否存在失败: %w", err)
	}
	if tableCount == 0 {
		return false, nil
	}
	var count int
	if err := conn.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM `t_user_account` WHERE `username` = ?", username).Scan(&count); err != nil {
		return false, fmt.Errorf("检查账号 %s 是否存在失败: %w", username, err)
	}
	return count > 0, nil
}

func execScript(ctx context.Context, conn *sql.Conn, script, adminHash string) (int64, error) {
	if adminHash != "" {
		script = strings.ReplaceAll(script, adminHashPlaceholder, adminHash)
	}

	statements := splitSQLStatements(script)
	var affected int64
	for i, stmt := range statements {
		result, err := conn.ExecContext(ctx, stmt)
		if err != nil {
			return affected, fmt.Errorf("第 %d 条语句执行失败: %w", i+1, err)
		}
		if n, err := result.RowsAffected(); err == nil {
			affected += n
		}
	}
	return affected, nil
}

// splitSQLStatements 按分号拆分 SQL，正确处理字符串、反引号、行注释与块注释。
func splitSQLStatements(script string) []string {
	var statements []string
	var current strings.Builder

	const (
		normal = iota
		singleQuote
		doubleQuote
		backtick
		lineComment
		blockComment
	)
	state := normal

	runes := []rune(script)
	for i := 0; i < len(runes); i++ {
		ch := runes[i]
		next := rune(0)
		if i+1 < len(runes) {
			next = runes[i+1]
		}

		switch state {
		case normal:
			switch {
			case ch == '-' && next == '-':
				state = lineComment
				current.WriteRune(ch)
				current.WriteRune(next)
				i++
			case ch == '/' && next == '*':
				state = blockComment
				current.WriteRune(ch)
				current.WriteRune(next)
				i++
			case ch == '\'':
				state = singleQuote
				current.WriteRune(ch)
			case ch == '"':
				state = doubleQuote
				current.WriteRune(ch)
			case ch == '`':
				state = backtick
				current.WriteRune(ch)
			case ch == ';':
				if stmt := strings.TrimSpace(current.String()); stmt != "" && hasSQLContent(stmt) {
					statements = append(statements, stmt)
				}
				current.Reset()
			default:
				current.WriteRune(ch)
			}

		case singleQuote:
			current.WriteRune(ch)
			if ch == '\\' && i+1 < len(runes) {
				current.WriteRune(runes[i+1])
				i++
			} else if ch == '\'' {
				if next == '\'' {
					current.WriteRune(next)
					i++
				} else {
					state = normal
				}
			}

		case doubleQuote:
			current.WriteRune(ch)
			if ch == '\\' && i+1 < len(runes) {
				current.WriteRune(runes[i+1])
				i++
			} else if ch == '"' {
				if next == '"' {
					current.WriteRune(next)
					i++
				} else {
					state = normal
				}
			}

		case backtick:
			current.WriteRune(ch)
			if ch == '`' {
				state = normal
			}

		case lineComment:
			current.WriteRune(ch)
			if ch == '\n' {
				state = normal
			}

		case blockComment:
			current.WriteRune(ch)
			if ch == '*' && next == '/' {
				current.WriteRune(next)
				i++
				state = normal
			}
		}
	}

	if stmt := strings.TrimSpace(current.String()); stmt != "" && hasSQLContent(stmt) {
		statements = append(statements, stmt)
	}
	return statements
}

func hasSQLContent(stmt string) bool {
	for _, line := range strings.Split(stmt, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "--") || strings.HasPrefix(line, "/*") {
			continue
		}
		return true
	}
	return false
}

func containsVersion(versions []string, want string) bool {
	for _, v := range versions {
		if v == want {
			return true
		}
	}
	return false
}

func blankIfEmpty(value string) string {
	if strings.TrimSpace(value) == "" {
		return "(空)"
	}
	return value
}
