package handler

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"api-fiber-gorm/model/response"
	"api-fiber-gorm/services"
	"api-fiber-gorm/utils"
	"fmt"
	"strconv"
	"strings"

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

	if c.Query("contact") != "" {
		paramKeys = append(paramKeys, "contact like ?")
		paramValues = append(paramValues, "%"+c.Query("contact")+"%")
	}

	if c.Query("startCreateDate") != "" {
		paramKeys = append(paramKeys, "orderTime >= ?")
		paramValues = append(paramValues, c.Query("startCreateDate"))
	}

	if c.Query("endCreateDate") != "" {
		paramKeys = append(paramKeys, "orderTime <= ?")
		paramValues = append(paramValues, c.Query("endCreateDate"))
	}

	if c.Query("status") != "" {
		paramKeys = append(paramKeys, "status like ?")
		paramValues = append(paramValues, "%"+c.Query("status")+"%")
	}

	whereSql := " where 1=1 and " + strings.Join(paramKeys, " and ")

	return whereSql, paramValues
}

// 统计订单信息
func Statistics(c *fiber.Ctx) error {
	type StatisticsInfo struct {
		BuyMoney  string `db:"buyMoney" json:"buyMoney"`
		SellMoney string `db:"sellMoney" json:"sellMoney"`
		Number    string `db:"number" json:"number"`
		OtherCost string `db:"otherCost" json:"otherCost"`
	}

	var result StatisticsInfo
	whereSql, paramValues := handleSearchCondition(c)
	db := database.DBConn

	finalSql := "select IFNULL(sum(t.buyPrice*t.number),0) buyMoney,IFNULL(sum(t.sellPrice*t.number),0) sellMoney,IFNULL(sum(t.number),0) number, IFNULL(sum(t.otherCost),0) otherCost from t_order t " + whereSql

	db.Get(&result, finalSql, paramValues...)

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": result})
}

// 创建订单
func CreateOrder(c *fiber.Ctx) error {
	var order model.Order

	database.Create(c, "t_order", order)

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": nil})
}

// 撤销来自库存的订单
func RevokeStockOrder(c *fiber.Ctx) error {
	var oldOrder model.Order
	id := c.Params("id")

	if id != "" {
		intId, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(fiber.Map{"status": "error", "message": "id 错误"})
		}
		oldOrder, _ = services.GetOrderById(c, intId)
	}

	err := OutStock(oldOrder.StockId, "-"+oldOrder.Number)

	if err != nil {
		return c.JSON(fiber.Map{"status": "error", "message": "更新库存失败"})
	}

	err = services.DeleteOrder(c, id)

	if err != nil {
		return c.JSON(fiber.Map{"status": "error", "message": "删除订单数据失败", "id": id})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功"})
}

// 查询订单列表
func QueryOrderList(c *fiber.Ctx) error {
	type OrderQueryCondition struct {
		Table           string `table:"t_order"`
		Name            string `db:"name" json:"name" op:"like"`
		Contact         string `db:"contact" json:"contact" op:"like"`
		StartCreateDate string `db:"orderTime" json:"startCreateDate" op:">="`
		EndCreateDate   string `db:"orderTime" json:"endCreateDate" op:"<="`
		Status          string `db:"status" json:"status" op:"="`
	}
	var queryResult []model.Order

	result, e := database.QueryPage(c, &queryResult, OrderQueryCondition{})

	if e != nil {
		return c.JSON(response.Error(nil, e.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

// 删除订单
func DeleteOrder(c *fiber.Ctx) error {
	id := c.Params("id")

	error := services.DeleteOrder(c, id)

	if error != nil {
		return c.JSON(response.Error(nil, error.Error()))
	}

	return c.JSON(response.Success(nil, "删除成功"))
}

// 根据 ID 获取订单
func GetOrderById(c *fiber.Ctx) error {
	var order model.Order
	id := c.Params("id")

	if id != "" {
		intId, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(fiber.Map{"status": "error", "message": "id 错误"})
		}
		e := database.GetById(c, "t_order", intId, &order)

		if e != nil {
			fmt.Println("err=", e)
			return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
		}
		return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": order})

	} else {
		return c.JSON(fiber.Map{"status": "error", "message": "id 错误"})
	}
}

func UpdateOrder(c *fiber.Ctx) error {
	//db := database.DBConn
	var order model.Order

	if err := c.BodyParser(&order); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := database.Update(c, "t_order", order)
	//database.GetById(order)

	//result, e := db.Exec("update t_order set name=?, contact=?, phone=?, address=?, buyPrice=?, sellPrice=?, otherCost=?, number=?, remark=? where id=?",
	//	order.Name, order.Contact, order.Phone, order.Address, order.BuyPrice, order.SellPrice, order.OtherCost, order.Number, order.Remark, order.Id)
	//
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
