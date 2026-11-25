package router

import (
	api "hjq-notebook/internal/api"
	"hjq-notebook/internal/middleware"

	"github.com/gofiber/fiber/v2"
	// "github.com/gofiber/fiber/v2/middleware/logger"
)

// SetupRoutes setup router api
//
// 所有接口统一挂载在 /api 前缀下，便于与前端静态资源共用一个服务。
func SetupRoutes(app *fiber.App) {
	apiRoot := app.Group("/api")

	// 操作日志（审计日志）：只采集 /api 下的写操作与登录，GET 默认跳过。
	// 必须挂在 Protected() 之前，才能记录「登录失败」这类还没有 token 的请求。
	apiRoot.Use(middleware.OperationLog())

	// Auth
	authRouter := apiRoot.Group("/auth")
	authRouter.Post("/login", api.Login)

	authVerifyRouter := apiRoot.Use(middleware.Protected()).Use(middleware.User())

	overviewRouter := authVerifyRouter.Group("/overview")
	overviewRouter.Get("", api.OverviewData)
	overviewRouter.Get("/profit/statistics", api.ProfitStatic)
	overviewRouter.Get("/core-metrics", api.CoreMetricsData)
	overviewRouter.Get("/sales-distribution", api.SalesDistribution)
	overviewRouter.Get("/profit/trend", api.ProfitTrendWithCompare)

	orderRouter := authVerifyRouter.Group("/order")
	orderRouter.Delete("/revoke/stock/:id", api.RevokeStockOrder)
	orderRouter.Get("/statistics", api.OrderStatistics)
	orderRouter.Post("/batch", api.CreateOrderBatch)
	orderRouter.Post("", api.CreateOrder)
	orderRouter.Get("", api.QueryOrderList)
	orderRouter.Get("/contacts", api.QueryContactsByOrders)
	orderRouter.Get("/products", api.QueryProductsByOrders)
	orderRouter.Get("/:id", api.GetOrderById)
	orderRouter.Delete("/:id", api.DeleteOrder)
	orderRouter.Patch("/:id", api.UpdateOrder)
	orderRouter.Patch("/:id/status/:status", api.ChangeStatus)

	productRouter := authVerifyRouter.Group("/product")
	productRouter.Post("", api.CreateProduct)
	productRouter.Get("", api.QueryProductList)
	productRouter.Get("/:id", api.GetProductById)
	productRouter.Delete("/:id", api.DeleteProduct)
	productRouter.Patch("/:id", api.UpdateProduct)

	contactRouter := authVerifyRouter.Group("/contact")
	contactRouter.Get("/search", api.SearchContact)
	contactRouter.Post("", api.CreateContact)
	contactRouter.Get("", api.QueryContactList)
	contactRouter.Get("/:id", api.GetContactById)
	contactRouter.Delete("/:id", api.DeleteContact)
	contactRouter.Patch("/:id", api.UpdateContact)

	stockRouter := authVerifyRouter.Group("/stock")
	stockRouter.Get("/statistics", api.Statistics)
	stockRouter.Post("", api.CreateStock)
	stockRouter.Get("", api.QueryStockList)
	stockRouter.Get("/:id", api.GetStockById)
	stockRouter.Delete("/:id", api.DeleteStock)
	stockRouter.Patch("/:id", api.UpdateStock)

	alarmRouter := authVerifyRouter.Group("/alarm")
	alarmRouter.Get("/sendMessageToWeChatWebhook", api.SendMessageToWeChatWebhook)
	alarmRouter.Get("", api.QueryAlarmList)
	alarmRouter.Post("", api.CreateAlarm)
	alarmRouter.Patch("/:id", api.UpdateAlarm)
	alarmRouter.Delete("/:id", api.DeleteAlarm)
	alarmRouter.Get("/:id", api.CreateAlarm)

	// Auth
	userRouter := authVerifyRouter.Group("/user")
	userRouter.Get("/info", api.UserInfo)
	userRouter.Get("/", api.UserList)

	// Auth
	systemRouter := authVerifyRouter.Group("/system")
	systemRouter.Post("/data/transfer", api.TransferData)
	systemRouter.Get("/data/export", api.ExportData)
	systemRouter.Post("/data/import", api.ImportData)
	systemRouter.Post("/data/mail", api.SendDataSyncMail)
	systemRouter.Get("/data/mail/config", api.GetDataSyncMailConfig)
	systemRouter.Put("/data/mail/config", api.SaveDataSyncMailConfig)

	studentWorkRouter := authVerifyRouter.Group("/student-work")
	studentWorkRouter.Get("", api.QueryStudentWorkList)
	studentWorkRouter.Post("", api.CreateStudentWork)
	studentWorkRouter.Get("/:id", api.GetStudentWorkById)
	studentWorkRouter.Delete("/:id", api.DeleteStudentWork)
	studentWorkRouter.Patch("/:id", api.UpdateStudentWork)

	calculatorRouter := authVerifyRouter.Group("/calculator")
	calculatorRouter.Get("", api.QueryCalculatorList)
	calculatorRouter.Get("/:id", api.GetCalculatorById)
	calculatorRouter.Post("", api.CreateCalculator)
	calculatorRouter.Delete("/:id", api.DeleteCalculator)
	calculatorRouter.Patch("/:id", api.UpdateCalculator)

	// 操作日志查询（只看不改，接口本身不会被记录）
	// 仅 admin 可访问：其余登录用户 403（roles 缺失/为空同样 403，安全优先）
	operationLogRouter := authVerifyRouter.Group("/operation-log", middleware.AdminOnly())
	operationLogRouter.Get("", api.QueryOperationLogList)
	// options 必须注册在 /:id 之前，否则会被当成 id 参数
	operationLogRouter.Get("/options", api.QueryOperationLogOptions)
	operationLogRouter.Get("/:id", api.GetOperationLogById)
}
