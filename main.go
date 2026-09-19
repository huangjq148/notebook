package main

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/router"
	"hjq-notebook/internal/services"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New(fiber.Config{
		// 数据同步导入需要上传较大的 csv 文件
		BodyLimit: 32 * 1024 * 1024,
	})
	app.Use(cors.New())
	app.Static("/web", "web/dist")

	message, isSuccess := database.ConnectDB()

	if !isSuccess {
		log.Fatal(message)
		os.Exit(0)
	}

	router.SetupRoutes(app)

	// 每日定时将数据备份发送到邮箱
	services.StartDataSyncMailScheduler()

	log.Fatal(app.Listen(":3000"))
}
