package router

import (
	api "hjq-notebook/internal/api"
	"hjq-notebook/internal/middleware"

	"github.com/gofiber/fiber/v2"
	// "github.com/gofiber/fiber/v2/middleware/logger"
)

// SetupRoutes setup router api
func SetupRoutes(app *fiber.App) {
	// Middleware
	// api := app.Group("/api", logger.New())

	// Auth
	authRouter := app.Group("/auth")
	authRouter.Post("/login", api.Login)

	authVerifyRouter := app.Use(middleware.Protected()).Use(middleware.User())

	overviewRouter := authVerifyRouter.Group("/overview")
	overviewRouter.Get("", api.OverviewData)
	overviewRouter.Get("/profit/statistics", api.ProfitStatic)

	orderRouter := authVerifyRouter.Group("/order")
	orderRouter.Delete("/revoke/stock/:id", api.RevokeStockOrder)
	orderRouter.Get("/statistics", api.OrderStatistics)
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
	productRouter.Patch("", api.UpdateProduct)

	contactRouter := authVerifyRouter.Group("/contact")
	contactRouter.Get("/search", api.SearchContact)
	contactRouter.Post("", api.CreateContact)
	contactRouter.Get("", api.QueryContactList)
	contactRouter.Get("/:id", api.GetContactById)
	contactRouter.Delete("/:id", api.DeleteContact)
	contactRouter.Patch("", api.UpdateContact)

	stockRouter := authVerifyRouter.Group("/stock")
	stockRouter.Get("/statistics", api.Statistics)
	stockRouter.Post("", api.CreateStock)
	stockRouter.Get("", api.QueryStockList)
	stockRouter.Get("/:id", api.GetStockById)
	stockRouter.Delete("/:id", api.DeleteStock)
	stockRouter.Patch("", api.UpdateStock)

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
	calculatorRouter.Patch("", api.UpdateCalculator)
}
