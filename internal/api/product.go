package api

import (
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/oplog"
	"hjq-notebook/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateProduct(c *fiber.Ctx) error {
	db := database.DBConn
	var product model.Product
	userId := utils.GetUserId(c)

	if err := c.BodyParser(&product); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_product(name, buyPrice,sellPrice,createTime,createUser) values(?,?,?,?,?)",
		product.Name, product.BuyPrice, product.SellPrice, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	// 操作日志：新增只记改后数据；能拿到自增主键就把它作为目标 ID
	oplog.SetSnapshot(c, nil, product)
	if id, e := result.LastInsertId(); e == nil {
		oplog.SetTargetID(c, id)
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
	userId := utils.GetUserId(c)

	// 操作日志：删除前保留旧商品
	var before model.Product
	if e := db.Get(&before, "select * from t_product where id=?", id); e == nil {
		oplog.SetSnapshot(c, before, nil)
	}

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
	userId := utils.GetUserId(c)
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

	// 操作日志：更新前取旧记录，和请求体形成改前/改后对照
	var before model.Product
	if e := db.Get(&before, "select * from t_product where id=?", product.Id); e == nil {
		oplog.SetSnapshot(c, before, product)
	} else {
		oplog.SetSnapshot(c, nil, product)
	}

	result, e := db.Exec("update t_product set name=?, buyPrice=?, sellPrice=? where id=?", product.Name, product.BuyPrice, product.SellPrice, product.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
