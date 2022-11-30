package handler

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"api-fiber-gorm/utils"
	"errors"
	"fmt"
	"strings"
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

func QueryStockList(c *fiber.Ctx) error {
	var paramKeys []string
	var paramValues []interface{}
	var queryResult []model.Stock
	var count int
	db := database.DBConn
	pageSql := utils.GeneratePageSql(c)
	orderSql := " order by createTime desc"
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	paramKeys = append(paramKeys, "createUser=?")
	paramValues = append(paramValues, userId)

	paramKeys = append(paramKeys, "name like ?")
	paramValues = append(paramValues, "%"+c.Query("name")+"%")

	whereSql := " where " + strings.Join(paramKeys, " and ")

	finalSql := "select * from t_stock " + whereSql + orderSql + pageSql

	e := db.Select(&queryResult, finalSql, paramValues...)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	db.Get(&count, "select count(1) from t_stock "+whereSql, paramValues...)

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": fiber.Map{"content": queryResult, "total": count}})
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

	database.GetById(stock)

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
