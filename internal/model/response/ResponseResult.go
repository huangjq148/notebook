package response

import "github.com/gofiber/fiber/v2"

func Success(data interface{}, message string) interface{} {
	return fiber.Map{"status": "success", "data": data, "message": message}
}

func Error(message string) interface{} {
	return fiber.Map{"status": "error", "message": message, "data": ""}
}
