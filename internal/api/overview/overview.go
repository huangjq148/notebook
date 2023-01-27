package overview

import (
	"hjq-notebook/internal/database"
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

func ProfitStatic(c *fiber.Ctx) error {
	type Result struct {
		Profit    string `db:"profit" json:"profit"`
		OrderTime string `db:"orderTime" json:"orderTime"`
	}

	result := []Result{}
	sql := "select sum(sellPrice*number-buyPrice*number-otherCost) profit,orderTime from t_order  group by orderTime order by orderTime desc limit 0,14"
	database.DBConn.Select(&result, sql)

	return c.JSON(response.Success(result, "查询成功"))
}
