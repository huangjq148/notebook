package database

import (
	// "api-fiber-gorm/config"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	// "strconv"
)

var (
	DBConn *sqlx.DB
)

// ConnectDB connect to db
func ConnectDB() {
	var err error
	// p := config.Config("DB_PORT")
	// port, err := strconv.ParseUint(p, 10, 32)
	// dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable", config.Config("DB_HOST"), port, config.Config("DB_USER"), config.Config("DB_PASSWORD"), config.Config("DB_NAME"))
	// DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	db, _ := sqlx.Open("mysql", "root:root@tcp(127.0.0.1:3306)/notebook")

	if err != nil {
		panic("failed to connect database")
	}
	//设置数据库最大连接数
	db.SetConnMaxLifetime(100)
	// 设置上数据库最大闲置连接数
	db.SetMaxIdleConns(10)
	// 验证连接
	if err := db.Ping(); err != nil {
		fmt.Println("open database fail")
		return
	}

	DBConn = db
	fmt.Println("connnect success")

	fmt.Println("Connection Opened to Database")
	// DB.AutoMigrate(&model.Product{}, &model.User{})
}
