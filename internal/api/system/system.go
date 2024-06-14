package system

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type DataTransfer struct {
	Id     []int  `db:"id" json:"id"`
	Target string `db:"target" json:"target"`
}

func TransferData(c *fiber.Ctx) error {
	db := database.DBConn
	var dataTransfer DataTransfer
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&dataTransfer); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": ""})
}
