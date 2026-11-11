package database

import (
	"errors"
	"fmt"

	"github.com/jmoiron/sqlx"
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
