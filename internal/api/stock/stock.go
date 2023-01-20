package stock

import (
	"errors"
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateStock(c *fiber.Ctx) error {
	db := database.DBConn
	var stock model.Stock
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&stock); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_stock(name, buyPrice,sellPrice, number, createTime,createUser) values(?,?,?,?,?,?)",
		stock.Name, stock.BuyPrice, stock.SellPrice, stock.Number, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

// Statistics 统计订单信息
// func Statistics(c *fiber.Ctx) error {
// 	type StatisticsInfo struct {
// 		BuyMoney  string `db:"buyMoney" json:"buyMoney"`
// 		SellMoney string `db:"sellMoney" json:"sellMoney"`
// 		Number    string `db:"number" json:"number"`
// 		OtherCost string `db:"otherCost" json:"otherCost"`
// 	}

// 	var result StatisticsInfo
// 	whereSql, paramValues := handleSearchCondition(c)
// 	db := database.DBConn

// 	finalSql := "select IFNULL(sum(t.buyPrice*t.number),0) buyMoney,IFNULL(sum(t.sellPrice*t.number),0) sellMoney,IFNULL(sum(t.number),0) number, IFNULL(sum(t.otherCost),0) otherCost from t_order t " + whereSql

// 	db.Get(&result, finalSql, paramValues...)

// 	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": result})
// }

func QueryStockList(c *fiber.Ctx) error {
	type StockQueryCondition struct {
		Table string `table:"t_stock"`
		Name  string `db:"name" json:"name" op:"like"`
	}
	var queryResult []model.Stock

	result, e := database.QueryPage(c, &queryResult, StockQueryCondition{})

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(response.Success(result, "查询成功"))
}

func DeleteStock(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	result, e := db.Exec("delete from t_stock where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

func GetStockById(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var stock model.Stock

	e := db.Get(&stock, "select * from t_stock where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": stock})
}

func UpdateStock(c *fiber.Ctx) error {
	db := database.DBConn
	var stock model.Stock

	if err := c.BodyParser(&stock); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	//database.GetById(stock)

	result, e := db.Exec("update t_stock set name=?, buyPrice=?, sellPrice=?, number=? where id=?", stock.Name, stock.BuyPrice, stock.SellPrice, stock.Number, stock.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}

func OutStock(id int, number string) error {
	db := database.DBConn

	sql := "update t_stock set number = number-? where id=? "

	fmt.Println(sql, number, id)

	result, e := db.Exec(sql, number, id)

	if e != nil {
		fmt.Println("err=", e)
		return errors.New("库存修改失败")
	}

	fmt.Println(result)
	return nil
}
