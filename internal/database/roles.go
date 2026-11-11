package database

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

// RoleColumnReady reports whether the account role column is available.
// Operation log access must remain closed when this column is unavailable.
func RoleColumnReady() bool {
	if DBConn == nil {
		return false
	}
	return roleColumnReady(DBConn)
}

func roleColumnReady(db *sqlx.DB) bool {
	var count int
	err := db.Get(&count, `SELECT COUNT(*) FROM information_schema.columns
		WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
		"t_user_account", "roles")
	return err == nil && count > 0
}

// MigrateRoles adds the role column to older installations and grants the
// existing huangjq business account admin access. Both operations are safe to
// run on every application startup.
func MigrateRoles(db *sqlx.DB) error {
	if db == nil {
		return errors.New("database connection is nil")
	}

	if !roleColumnReady(db) {
		_, err := db.Exec(`ALTER TABLE t_user_account
			ADD COLUMN roles VARCHAR(255) NOT NULL DEFAULT 'user'`)
		if err != nil && !roleColumnReady(db) {
			return fmt.Errorf("add t_user_account.roles: %w", err)
		}
	}

	if !roleColumnReady(db) {
		return errors.New("t_user_account.roles is unavailable after migration")
	}
	if err := ensurePasswordHashCapacity(db); err != nil {
		return err
	}
	if err := ensureHuangjqAccount(db); err != nil {
		return err
	}

	_, err := db.Exec(`UPDATE t_user_account
		SET roles = IF(FIND_IN_SET('admin', COALESCE(roles, '')) > 0,
			roles, CONCAT_WS(',', NULLIF(TRIM(roles), ''), 'admin'))
		WHERE username = ?`, "huangjq")
	if err != nil {
		return fmt.Errorf("ensure huangjq admin role: %w", err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS t_operation_log (
		id BIGINT NOT NULL AUTO_INCREMENT,
		username VARCHAR(100) NOT NULL DEFAULT '',
		method VARCHAR(16) NOT NULL DEFAULT '',
		path VARCHAR(512) NOT NULL DEFAULT '',
		statusCode INT NOT NULL DEFAULT 0,
		ip VARCHAR(64) NOT NULL DEFAULT '',
		createTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (id),
		KEY idx_operation_log_create_time (createTime)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
	if err != nil {
		return fmt.Errorf("ensure t_operation_log table: %w", err)
	}
	return nil
}

// ensurePasswordHashCapacity widens the legacy password column only when it
// cannot hold a bcrypt hash. Existing password values are preserved.
func ensurePasswordHashCapacity(db *sqlx.DB) error {
	var maxLength sql.NullInt64
	err := db.Get(&maxLength, `SELECT character_maximum_length FROM information_schema.columns
		WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
		"t_user_account", "password")
	if err != nil {
		return fmt.Errorf("inspect t_user_account.password: %w", err)
	}
	if !maxLength.Valid || maxLength.Int64 >= 60 {
		return nil
	}
	if _, err := db.Exec(`ALTER TABLE t_user_account
		MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL`); err != nil {
		return fmt.Errorf("expand t_user_account.password for bcrypt hashes: %w", err)
	}
	return nil
}

// ensureHuangjqAccount bootstraps the account only when it is absent. The
// password and linked t_user ID must come from deployment configuration; an
// existing account's password and other fields are never replaced.
func ensureHuangjqAccount(db *sqlx.DB) error {
	var count int
	if err := db.Get(&count, `SELECT COUNT(*) FROM t_user_account WHERE username = ?`, "huangjq"); err != nil {
		return fmt.Errorf("check huangjq account: %w", err)
	}
	if count > 0 {
		return nil
	}

	userID := strings.TrimSpace(os.Getenv("HUANGJQ_BOOTSTRAP_USER_ID"))
	password := os.Getenv("HUANGJQ_BOOTSTRAP_PASSWORD")
	if userID == "" || password == "" {
		return errors.New("huangjq account is missing; set HUANGJQ_BOOTSTRAP_USER_ID and HUANGJQ_BOOTSTRAP_PASSWORD to bootstrap it")
	}

	var userCount int
	if err := db.Get(&userCount, `SELECT COUNT(*) FROM t_user WHERE id = ?`, userID); err != nil {
		return fmt.Errorf("validate HUANGJQ_BOOTSTRAP_USER_ID: %w", err)
	}
	if userCount == 0 {
		return errors.New("HUANGJQ_BOOTSTRAP_USER_ID does not match a t_user.id")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash huangjq bootstrap password: %w", err)
	}
	_, err = db.Exec(`INSERT INTO t_user_account (username, password, userId, roles)
		SELECT ?, ?, ?, 'admin,user' FROM DUAL
		WHERE NOT EXISTS (SELECT 1 FROM t_user_account WHERE username = ?)`,
		"huangjq", string(hash), userID, "huangjq")
	if err != nil {
		return fmt.Errorf("create huangjq account: %w", err)
	}

	if err := db.Get(&count, `SELECT COUNT(*) FROM t_user_account WHERE username = ?`, "huangjq"); err != nil {
		return fmt.Errorf("verify huangjq account: %w", err)
	}
	if count == 0 {
		return errors.New("huangjq account was not created")
	}
	return nil
}
