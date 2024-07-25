package main

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/router"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use(cors.New())
	app.Static("/web", "web/dist")

	message, isSuccess := database.ConnectDB()

	if !isSuccess {
		log.Fatal(message)
		os.Exit(0)
	}

	router.SetupRoutes(app)
	log.Fatal(app.Listen(":3000"))
}
