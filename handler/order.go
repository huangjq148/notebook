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

func handleSearchCondition(c *fiber.Ctx) (string, []interface{}) {
	var paramKeys []string
	var paramValues []interface{}
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	paramKeys = append(paramKeys, "createUser=?")
	paramValues = append(paramValues, userId)

	if c.Query("name") != "" {
		paramKeys = append(paramKeys, "name like ?")
		paramValues = append(paramValues, "%"+c.Query("name")+"%")
	}
	//
	if c.Query("contact") != "" {
		paramKeys = append(paramKeys, "contact like ?")
		paramValues = append(paramValues, "%"+c.Query("contact")+"%")
	}

	if c.Query("createTime") != "" {
		paramKeys = append(paramKeys, "createTime = ?")
		paramValues = append(paramValues, c.Query("createTime"))
	}

	fmt.Println(c.Query("status"))
	if c.Query("status") != "" {
		paramKeys = append(paramKeys, "status like ?")
		paramValues = append(paramValues, "%"+c.Query("status")+"%")
	}

	whereSql := " where 1=1 and " + strings.Join(paramKeys, " and ")
	fmt.Println(whereSql, paramValues)
	return whereSql, paramValues
}

type StatisticsInfo struct {
	BuyMoney  int `db:"buyMoney" json:"buyMoney"`
	SellMoney int `db:"sellMoney" json:"sellMoney"`
	Number    int `db:"number" json:"number"`
}

func Statistics(c *fiber.Ctx) error {
	var result StatisticsInfo
	whereSql, paramValues := handleSearchCondition(c)
	db := database.DBConn

	fmt.Println(paramValues)
	fmt.Println("select sum(t.buyPrice*t.number) buyMoney,sum(t.sellPrice*t.number) sellMoney,sum(t.number) number from t_order t " + whereSql)
	db.Get(&result, "select sum(t.buyPrice*t.number) buyMoney,sum(t.sellPrice*t.number) sellMoney,sum(t.number) number from t_order t "+whereSql, paramValues...)
	// db.Get(&result, "select sum(t.buyPrice*t.number) buyMoney,sum(t.sellPrice*t.number) sellMoney,sum(t.number) number from t_order t ")
	fmt.Println(result)
	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": result})
}

func CreateOrder(c *fiber.Ctx) error {
	db := database.DBConn
	var order model.Order
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&order); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_order(name, contact, phone, address, buyPrice, sellPrice , number, status, remark, createTime, createUser) values(?,?,?,?,?,?,?,?,?,?,?)",
		order.Name, order.Contact, order.Phone, order.Address, order.BuyPrice, order.SellPrice, order.Number, order.Status, order.Remark, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

func QueryOrderList(c *fiber.Ctx) error {
	var queryResult []model.Order
	var count int
	db := database.DBConn
	pageSql := utils.GeneratePageSql(c)
	orderSql := " order by createTime desc"
	whereSql, paramValues := handleSearchCondition(c)

	finalSql := "select * from t_order " + whereSql + orderSql + pageSql

	e := db.Select(&queryResult, finalSql, paramValues...)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	db.Get(&count, "select count(1) from t_order where "+whereSql, paramValues...)

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": fiber.Map{"content": queryResult, "total": count}})
}

func DeleteOrder(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	result, e := db.Exec("delete from t_order where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "删除成功", "data": result})
}

func GetOrderById(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var order model.Order

	e := db.Get(&order, "select * from t_order where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": order})
}

func UpdateOrder(c *fiber.Ctx) error {
	db := database.DBConn
	var order model.Order

	if err := c.BodyParser(&order); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	database.GetById(order)

	result, e := db.Exec("update t_order set name=?, contact=?, phone=?, address=?, buyPrice=?, sellPrice=?, number=?, remark=? where id=?",
		order.Name, order.Contact, order.Phone, order.Address, order.BuyPrice, order.SellPrice, order.Number, order.Remark, order.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}

func ChangeStatus(c *fiber.Ctx) error {
	db := database.DBConn
	status := c.Params("status")
	id := c.Params("id")

	result, e := db.Exec("update t_order set status=? where id=?", status, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
