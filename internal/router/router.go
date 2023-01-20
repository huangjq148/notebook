package router

import (
	"hjq-notebook/internal/api/auth"
	"hjq-notebook/internal/api/contact"
	"hjq-notebook/internal/api/order"
	"hjq-notebook/internal/api/overview"
	"hjq-notebook/internal/api/product"
	"hjq-notebook/internal/api/stock"
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

	overviewRouter := app.Group("/overview")
	overviewRouter.Get("", middleware.Protected(), overview.OverviewData)

	orderRouter := app.Group("/order")
	orderRouter.Delete("/revoke/stock/:id", middleware.Protected(), order.RevokeStockOrder)
	orderRouter.Get("/statistics", middleware.Protected(), order.Statistics)
	orderRouter.Post("", middleware.Protected(), order.CreateOrder)
	orderRouter.Get("", middleware.Protected(), order.QueryOrderList)
	orderRouter.Get("/:id", middleware.Protected(), order.GetOrderById)
	orderRouter.Delete("/:id", middleware.Protected(), order.DeleteOrder)
	orderRouter.Patch("", middleware.Protected(), order.UpdateOrder)
	orderRouter.Patch("/:id/status/:status", middleware.Protected(), order.ChangeStatus)

	productRouter := app.Group("/product")
	productRouter.Post("", middleware.Protected(), product.CreateProduct)
	productRouter.Get("", middleware.Protected(), product.QueryProductList)
	productRouter.Get("/:id", middleware.Protected(), product.GetProductById)
	productRouter.Delete("/:id", middleware.Protected(), product.DeleteProduct)
	productRouter.Patch("", middleware.Protected(), product.UpdateProduct)

	contactRouter := app.Group("/contact")
	contactRouter.Get("/search", middleware.Protected(), contact.SearchContact)
	contactRouter.Post("", middleware.Protected(), contact.CreateContact)
	contactRouter.Get("", middleware.Protected(), contact.QueryContactList)
	contactRouter.Get("/:id", middleware.Protected(), contact.GetContactById)
	contactRouter.Delete("/:id", middleware.Protected(), contact.DeleteContact)
	contactRouter.Patch("", middleware.Protected(), contact.UpdateContact)

	stockRouter := app.Group("/stock")
	stockRouter.Post("", middleware.Protected(), stock.CreateStock)
	stockRouter.Get("", middleware.Protected(), stock.QueryStockList)
	stockRouter.Get("/:id", middleware.Protected(), stock.GetStockById)
	stockRouter.Delete("/:id", middleware.Protected(), stock.DeleteStock)
	stockRouter.Patch("", middleware.Protected(), stock.UpdateStock)

	// // Auth
	userRouter := app.Group("/user")
	userRouter.Get("/info", middleware.Protected(), user.UserInfo)
}
