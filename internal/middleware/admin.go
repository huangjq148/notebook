package middleware

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

// AdminOnly 只允许 roles 含 admin 的用户访问。
//
// 两道判断：
//  1. roles 列不可用（老库未执行 migration.sql）→ 一律 403。
//     即使 token 里带着历史 admin 角色也不能放行，保证「降级 = 所有人 403」；
//  2. 从 JWT claim 读 roles（登录时写入），含 admin 才放行。
//     claim 缺失/类型不符/为空 → 视为普通用户，一律 403，不做放行兜底。
func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if !database.RoleColumnReady() {
			return forbidden(c)
		}

		roles := utils.RolesFromToken(c.Get(fiber.HeaderAuthorization))
		if !utils.HasRole(roles, utils.RoleAdmin) {
			return forbidden(c)
		}

		return c.Next()
	}
}

func forbidden(c *fiber.Ctx) error {
	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"status":  "error",
		"message": "没有权限",
		"data":    nil,
	})
}
