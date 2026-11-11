package middleware

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// AdminOnly keeps privileged routes closed unless the token explicitly has
// the admin role. Tokens issued before roles were added therefore remain denied.
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !database.RoleColumnReady() {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status":  "error",
				"message": "没有权限",
			})
		}
		for _, role := range utils.RolesFromToken(c.Get("Authorization")) {
			if role == "admin" {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"status":  "error",
			"message": "没有权限",
		})
	}
}
