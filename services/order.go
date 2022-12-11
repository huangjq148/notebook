package services

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"hjq-notebook/database"
	"hjq-notebook/model"
)

func GetOrderById(c *fiber.Ctx, id int) (model.Order, error) {
	var order model.Order

	e := database.GetById(c, "t_order", id, &order)

	if e != nil {
		return order, errors.New("查找不到数据")
	}

	return order, nil
}

func DeleteOrder(c *fiber.Ctx, id string) error {
	e := database.DeleteById(c, "t_order", id)

	if e != nil {
		return errors.New("删除订单失败")
	}

	return nil
}
