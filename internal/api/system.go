package api

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type DataTransfer struct {
	UserId  int    `json:"userId"`
	DataIds []int  `json:"dataIds"`
	Type    string `json:"type"`
}

func TransferData(c *fiber.Ctx) error {
	db := database.DBConn
	var dataTransfer DataTransfer
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var tableName string

	if err := c.BodyParser(&dataTransfer); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	if dataTransfer.Type == "order" {
		tableName = "t_order"
	} else if dataTransfer.Type == "stock" {
		tableName = "t_stock"
	} else if dataTransfer.Type == "contact" {
		tableName = "t_contact"
	}

	for _, id := range dataTransfer.DataIds {
		_, err := db.Exec("update "+tableName+" set createUser=? where id = ? and createUser = ?", dataTransfer.UserId, id, userId)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "数据转移成功", "data": ""})

}
