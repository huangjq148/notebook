package router

import (
	"api-fiber-gorm/handler"
	"api-fiber-gorm/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// SetupRoutes setup router api
func SetupRoutes(app *fiber.App) {
	// Middleware
	api := app.Group("/api", logger.New())
	api.Get("/", handler.Hello)

	// Auth
	auth := app.Group("/auth")
	auth.Post("/login", handler.Login)

	product := app.Group("/product")
	product.Post("", middleware.Protected(), handler.CreateProduct)
	product.Get("", middleware.Protected(), handler.QueryProductList)
	product.Get("/:id", middleware.Protected(), handler.GetProductById)
	product.Delete("/:id", middleware.Protected(), handler.DeleteProduct)
	product.Patch("", middleware.Protected(), handler.UpdateProduct)

	contact := app.Group("/contact")
	contact.Post("", middleware.Protected(), handler.CreateContact)
	contact.Get("", middleware.Protected(), handler.QueryContactList)
	contact.Get("/:id", middleware.Protected(), handler.GetContactById)
	contact.Delete("/:id", middleware.Protected(), handler.DeleteContact)
	contact.Patch("", middleware.Protected(), handler.UpdateContact)

	stock := app.Group("/stock")
	stock.Post("", middleware.Protected(), handler.CreateStock)
	stock.Get("", middleware.Protected(), handler.QueryStockList)
	stock.Get("/:id", middleware.Protected(), handler.GetStockById)
	stock.Delete("/:id", middleware.Protected(), handler.DeleteStock)
	stock.Patch("", middleware.Protected(), handler.UpdateStock)

	order := app.Group("/order")
	order.Post("", middleware.Protected(), handler.CreateOrder)
	order.Get("", middleware.Protected(), handler.QueryOrderList)
	order.Get("/:id", middleware.Protected(), handler.GetOrderById)
	order.Delete("/:id", middleware.Protected(), handler.DeleteOrder)
	order.Patch("", middleware.Protected(), handler.UpdateOrder)

	// Auth
	user := api.Group("/user")
	user.Get("/info", middleware.Protected(), handler.UserInfo)

	// // User
	// user := api.Group("/user")
	// user.Get("/:id", handler.GetUser)
	// user.Post("/", handler.CreateUser)
	// user.Patch("/:id", middleware.Protected(), handler.UpdateUser)
	// user.Delete("/:id", middleware.Protected(), handler.DeleteUser)

	// // Product
	// product := api.Group("/product")
	// product.Get("/", handler.GetAllProducts)
	// product.Get("/:id", handler.GetProduct)
	// product.Post("/", middleware.Protected(), handler.CreateProduct)
	// product.Delete("/:id", middleware.Protected(), handler.DeleteProduct)
}
