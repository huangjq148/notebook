package router

import (
	"hjq-notebook/internal/api/alarm"
	"hjq-notebook/internal/api/auth"
	"hjq-notebook/internal/api/calculator"
	"hjq-notebook/internal/api/contact"
	"hjq-notebook/internal/api/order"
	"hjq-notebook/internal/api/overview"
	"hjq-notebook/internal/api/product"
	"hjq-notebook/internal/api/stock"
	"hjq-notebook/internal/api/studentWork"
	"hjq-notebook/internal/api/system"
	"hjq-notebook/internal/api/user"
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
	authRouter.Post("/login", auth.Login)

	authVerifyRouter := app.Use(middleware.Protected()).Use(middleware.User())

	overviewRouter := authVerifyRouter.Group("/overview")
	overviewRouter.Get("", overview.OverviewData)
	overviewRouter.Get("/profit/statistics", overview.ProfitStatic)

	orderRouter := authVerifyRouter.Group("/order")
	orderRouter.Delete("/revoke/stock/:id", order.RevokeStockOrder)
	orderRouter.Get("/statistics", order.Statistics)
	orderRouter.Post("", order.CreateOrder)
	orderRouter.Get("", order.QueryOrderList)
	orderRouter.Get("/contacts", order.QueryContactsByOrders)
	orderRouter.Get("/products", order.QueryProductsByOrders)
	orderRouter.Get("/:id", order.GetOrderById)
	orderRouter.Delete("/:id", order.DeleteOrder)
	orderRouter.Patch("", order.UpdateOrder)
	orderRouter.Patch("/:id/status/:status", order.ChangeStatus)

	productRouter := authVerifyRouter.Group("/product")
	productRouter.Post("", product.CreateProduct)
	productRouter.Get("", product.QueryProductList)
	productRouter.Get("/:id", product.GetProductById)
	productRouter.Delete("/:id", product.DeleteProduct)
	productRouter.Patch("", product.UpdateProduct)

	contactRouter := authVerifyRouter.Group("/contact")
	contactRouter.Get("/search", contact.SearchContact)
	contactRouter.Post("", contact.CreateContact)
	contactRouter.Get("", contact.QueryContactList)
	contactRouter.Get("/:id", contact.GetContactById)
	contactRouter.Delete("/:id", contact.DeleteContact)
	contactRouter.Patch("", contact.UpdateContact)

	stockRouter := authVerifyRouter.Group("/stock")
	stockRouter.Get("/statistics", stock.Statistics)
	stockRouter.Post("", stock.CreateStock)
	stockRouter.Get("", stock.QueryStockList)
	stockRouter.Get("/:id", stock.GetStockById)
	stockRouter.Delete("/:id", stock.DeleteStock)
	stockRouter.Patch("", stock.UpdateStock)

	alarmRouter := authVerifyRouter.Group("/alarm")
	alarmRouter.Get("/sendMessageToWeChatWebhook", alarm.SendMessageToWeChatWebhook)
	alarmRouter.Get("", alarm.QueryAlarmList)
	alarmRouter.Post("", alarm.CreateAlarm)
	alarmRouter.Patch("/:id", alarm.UpdateAlarm)
	alarmRouter.Delete("/:id", alarm.DeleteAlarm)
	alarmRouter.Get("/:id", alarm.CreateAlarm)

	// Auth
	userRouter := authVerifyRouter.Group("/user")
	userRouter.Get("/info", user.UserInfo)
	userRouter.Get("/", user.UserList)

	// Auth
	systemRouter := authVerifyRouter.Group("/system")
	systemRouter.Post("/data/transfer", system.TransferData)

	studentWorkRouter := authVerifyRouter.Group("/student-work")
	studentWorkRouter.Get("", studentWork.QueryStudentWorkList)
	studentWorkRouter.Post("", studentWork.CreateStudentWork)
	studentWorkRouter.Get("/:id", studentWork.GetStudentWorkById)
	studentWorkRouter.Delete("/:id", studentWork.DeleteStudentWork)
	studentWorkRouter.Patch("/:id", studentWork.UpdateStudentWork)

	calculatorRouter := authVerifyRouter.Group("/calculator")
	calculatorRouter.Get("", calculator.QueryCalculatorList)
	calculatorRouter.Get("/:id", calculator.GetCalculatorById)
	calculatorRouter.Post("", calculator.CreateCalculator)
	calculatorRouter.Delete("/:id", calculator.DeleteCalculator)
	calculatorRouter.Patch("", calculator.UpdateCalculator)
}
