package database

import (
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
)

// DB gorm connector
var DB *sql.DB
