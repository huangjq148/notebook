package handler

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"api-fiber-gorm/model/response"
	"api-fiber-gorm/utils"
	"fmt"
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
	type ProductQueryCondition struct {
		Table string `table:"t_product"`
		Name  string `db:"name" json:"name" op:"like"`
	}

	var queryResult []model.Product

	result, e := database.QueryPage(c, &queryResult, ProductQueryCondition{})

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(response.Success(result, "查询成功"))
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

	//database.GetById(product)

	result, e := db.Exec("update t_product set name=?, buyPrice=?, sellPrice=? where id=?", product.Name, product.BuyPrice, product.SellPrice, product.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
