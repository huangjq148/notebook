package handler

import (
	"fmt"
	"hjq-notebook/database"
	"hjq-notebook/model"
	"hjq-notebook/model/response"
	"hjq-notebook/services"
	"hjq-notebook/utils"
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

// Statistics 统计订单信息
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

// CreateOrder 创建订单
func CreateOrder(c *fiber.Ctx) error {
	var order model.Order

	database.Create(c, "t_order", order)

	return c.JSON(response.Success(nil, "创建成功"))
}

// RevokeStockOrder 撤销来自库存的订单
func RevokeStockOrder(c *fiber.Ctx) error {
	var oldOrder model.Order
	id := c.Params("id")

	if id != "" {
		intId, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(response.Error("id 错误"))
		}
		oldOrder, _ = services.GetOrderById(c, intId)
	}

	err := OutStock(oldOrder.StockId, "-"+oldOrder.Number)

	if err != nil {
		return c.JSON(response.Error("更新库存失败"))
	}

	err = services.DeleteOrder(c, id)

	if err != nil {
		return c.JSON(response.Error("删除订单数据失败"))
	}

	return c.JSON(response.Success("", "修改成功"))
}

// QueryOrderList 查询订单列表
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
		return c.JSON(response.Error(e.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

// DeleteOrder 删除订单
func DeleteOrder(c *fiber.Ctx) error {
	id := c.Params("id")

	error := services.DeleteOrder(c, id)

	if error != nil {
		return c.JSON(response.Error(error.Error()))
	}

	return c.JSON(response.Success(nil, "删除成功"))
}

// GetOrderById 根据 ID 获取订单
func GetOrderById(c *fiber.Ctx) error {
	var order model.Order
	id := c.Params("id")

	intId, err := strconv.Atoi(id)
	if err != nil {
		return c.JSON(fiber.Map{"status": "error", "message": "id 错误"})
	}
	e := database.GetById(c, "t_order", intId, &order)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(response.Error(e.Error()))
	}

	return c.JSON(response.Success(order, "查询成功"))
}

// UpdateOrder 更新订单
func UpdateOrder(c *fiber.Ctx) error {
	var order model.Order

	if err := c.BodyParser(&order); err != nil {
		return c.JSON(response.Error("参数格式错误" + err.Error()))
	}

	_, e := database.Update(c, "t_order", order)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(response.Error("修改失败"))
	}

	return c.JSON(response.Success("", "修改成功"))
}

// ChangeStatus 修改订单状态
func ChangeStatus(c *fiber.Ctx) error {
	type OrderStatusChange struct {
		Id     string `db:"id"`
		Status string `db:"status"`
	}
	status := c.Params("status")
	id := c.Params("id")

	var newOrder OrderStatusChange
	newOrder.Id = id
	newOrder.Status = status

	_, e := database.UpdateEntity(c, "t_order", newOrder)

	if e != nil {
		fmt.Println("err=", e.Error())
		return c.JSON(response.Error("修改失败"))
	}

	return c.JSON(response.Success("", "修改成功"))
}
