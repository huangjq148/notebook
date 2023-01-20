package overview

import (
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/services"

	"github.com/gofiber/fiber/v2"
)

func OverviewData(c *fiber.Ctx) error {
	top5BuyGoods := services.GetTop5BuyGoods(c)
	top5SellGoods := services.GetTop5SellGoods(c)
	top5ProfitGoods := services.GetTop5ProfitGoods(c)
	top5BuyCustomer := services.GetTop5BuyCustomer(c)

	return c.JSON(response.Success(fiber.Map{
		"top5BuyGoods":    top5BuyGoods,
		"top5SellGoods":   top5SellGoods,
		"top5ProfitGoods": top5ProfitGoods,
		"top5BuyCustomer": top5BuyCustomer,
	}, "查询成功"))
}
