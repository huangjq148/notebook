package handler

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"api-fiber-gorm/utils"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateProduct(c *fiber.Ctx) error {
	db := database.DBConn
	var product model.Product
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_product(name, buyPrice,sellPrice,createTime,createUser) values(?,?,?,?,?)",
		product.Name, product.BuyPrice, product.SellPrice, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

func QueryProductList(c *fiber.Ctx) error {
	var paramKeys []string
	var paramValues []interface{}
	var queryResult []model.Product
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

	finalSql := "select * from t_product " + whereSql + orderSql + pageSql

	e := db.Select(&queryResult, finalSql, paramValues...)
	fmt.Println("sql=", finalSql, "params", paramValues)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	db.Get(&count, "select count(1) from t_product "+whereSql, paramValues...)

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": fiber.Map{"content": queryResult, "total": count}})
}

func DeleteProduct(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	result, e := db.Exec("delete from t_product where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

func GetProductById(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var product model.Product

	e := db.Get(&product, "select * from t_product where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": product})
}

func UpdateProduct(c *fiber.Ctx) error {
	db := database.DBConn
	var product model.Product

	if err := c.BodyParser(&product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	database.GetById(product)

	result, e := db.Exec("update t_product set name=?, buyPrice=?, sellPrice=? where id=?", product.Name, product.BuyPrice, product.SellPrice, product.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
