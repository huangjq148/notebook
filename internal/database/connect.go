package database

import (
	"fmt"
	"strconv"

	"hjq-notebook/internal/config"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

var (
	DBConn *sqlx.DB
)

// ConnectDB connect to db
func ConnectDB() (string, bool) {
	var err error

	host := config.Config("DB_HOST")
	portStr := config.Config("DB_PORT")
	user := config.Config("DB_USER")
	password := config.Config("DB_PASSWORD")
	dbName := config.Config("DB_NAME")

	port, err := strconv.Atoi(portStr)
	if err != nil {
		port = 3306
	}

	connectInfo := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port, dbName)

	db, err := sqlx.Open("mysql", connectInfo)
	if err != nil {
		panic("failed to connect database")
	}
	//设置数据库最大连接数
	db.SetConnMaxLifetime(100)
	// 设置上数据库最大闲置连接数
	db.SetMaxIdleConns(10)
	// 验证连接
	if err := db.Ping(); err != nil {
		fmt.Println("open database fail", err, connectInfo)
		return "数据库链接失败", false
	}

	DBConn = db
	fmt.Println("connnect success")

	fmt.Println("Connection Opened to Database")
	// DB.AutoMigrate(&model.Product{}, &model.User{})
	return "数据库链接成功", true
}
