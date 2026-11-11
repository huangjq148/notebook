package main

import (
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"hjq-notebook/internal/config"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/oplog"
	"hjq-notebook/internal/router"
	"hjq-notebook/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// staticDir 前端构建产物目录
const staticDir = "./web/dist"

func main() {
	// 反代真实 IP：默认关闭（不配环境变量时行为与改造前完全一致）
	proxyConfig := config.ResolveProxyConfig()

	app := fiber.New(fiber.Config{
		// 数据同步导入需要上传较大的 csv 文件
		BodyLimit: 32 * 1024 * 1024,
		// 反代 IP 解析：只有 header 与可信代理白名单同时配置才会启用，
		// 否则保持零值（c.IP() 取 RemoteIP()），避免客户端伪造 IP。
		ProxyHeader:             proxyConfig.ProxyHeader,
		EnableTrustedProxyCheck: proxyConfig.EnableTrustedProxyCheck,
		TrustedProxies:          proxyConfig.TrustedProxies,
	})
	app.Use(cors.New())

	message, isSuccess := database.ConnectDB()
	if !isSuccess {
		log.Fatal(message)
		os.Exit(0)
	}

	// 角色：探测 t_user_account.roles 是否存在（老库可能没有）。
	// 探测失败/缺列只打醒目 warn 并降级（操作日志对所有人 403），绝不阻断启动。
	database.EnsureRoleSupport()

	// 操作日志：兜底建表（IF NOT EXISTS，不影响已有库）+ 启动异步写入器。
	// 建表失败只打 warn，不阻断启动，更不能 panic。
	if err := database.EnsureOperationLogSchema(); err != nil {
		log.Println("[warn] ensure operation log schema fail:", err)
	}
	oplog.Start()

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

	// 每日清理过期的操作日志（OPLOG_RETENTION_DAYS，默认 180 天，0 表示永久保留）
	services.StartOperationLogCleanupScheduler()

	// 退出前尽量把操作日志队列写干净，避免丢审计记录
	app.Hooks().OnShutdown(func() error {
		oplog.Stop()
		return nil
	})

	// SIGINT / SIGTERM 触发优雅关闭，进而执行上面的 OnShutdown 钩子
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("收到退出信号，正在关闭服务…")
		if err := app.Shutdown(); err != nil {
			log.Println("关闭服务失败:", err)
		}
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// 优雅关闭时 Listen 返回 nil，只有真正出错才 Fatal
	if err := app.Listen(":" + port); err != nil {
		log.Fatal(err)
	}
}
