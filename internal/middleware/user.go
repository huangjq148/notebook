package middleware

import (
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func User() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")

		userId := utils.GetFromToken(token, "user_id")

		c.Request().Header.Add("current_user_id", userId)

		return c.Next()
	}
}
