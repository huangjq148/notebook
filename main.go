package main

import (
	"log"
	"os"
	"strings"

	"hjq-notebook/internal/database"
	"hjq-notebook/internal/router"
	"hjq-notebook/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// staticDir 前端构建产物目录
const staticDir = "./web/dist"

func main() {
	app := fiber.New(fiber.Config{
		// 数据同步导入需要上传较大的 csv 文件
		BodyLimit: 32 * 1024 * 1024,
	})
	app.Use(cors.New())

	message, isSuccess := database.ConnectDB()
	if !isSuccess {
		log.Fatal(message)
		os.Exit(0)
	}

	// 接口统一挂载在 /api 下
	router.SetupRoutes(app)

	// 前端静态资源与 SPA 路由回退，前后端共用一个服务
	app.Static("/", staticDir, fiber.Static{Index: "index.html"})
	app.Get("/*", func(c *fiber.Ctx) error {
		if strings.HasPrefix(c.Path(), "/api") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"status": "error", "message": "接口不存在"})
		}
		return c.SendFile(staticDir + "/index.html")
	})

	// 每日定时将数据备份发送到邮箱
	services.StartDataSyncMailScheduler()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Fatal(app.Listen(":" + port))
}
