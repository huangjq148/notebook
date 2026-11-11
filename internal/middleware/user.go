package middleware

import (
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func User() fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")

		userId := utils.GetFromToken(token, "user_id")

		// 必须用 Set（不能用 Add）：fasthttp 的 Peek 返回同名头的第一个值，
		// 用 Add 追加会让客户端自带的 current_user_id 覆盖服务端注入的可信值，
		// 导致审计日志 userId 可伪造、overview 等按该头取 userId 的接口被越权读。
		c.Request().Header.Set("current_user_id", userId)

		return c.Next()
	}
}
