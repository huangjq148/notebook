package services

import (
	"errors"
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type STATISTICS struct {
	Name  string `db:"name" json:"name"`
	Money string `db:"money" json:"money"`
}

func handleTopDataCondition(c *fiber.Ctx) (string, []interface{}) {
	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)
	userId := utils.GetUserId(c)
	startOrderTime := c.Query("startOrderTime")
	endOrderTime := c.Query("endOrderTime")
	whereSql := " where 1=1 "

	if startOrderTime != "" {
		conditionNames = append(conditionNames, " and orderTime>=?")
		conditions = append(conditions, startOrderTime)

	}
	if endOrderTime != "" {
		conditionNames = append(conditionNames, " and orderTime<=?")
		conditions = append(conditions, startOrderTime)
	}

	conditionNames = append(conditionNames, " and createUser=?")
	conditions = append(conditions, userId)

	return whereSql + strings.Join(conditionNames, " "), conditions
}

func GetTop5BuyGoods(c *fiber.Ctx) []STATISTICS {
	var top5BuyGoods []STATISTICS
	// GoodsBuyTop5 进货最多的产品
	sql := "select name,sum(buyPrice*number) money from t_order "
	groupSql := " group by name order by money desc limit 5"
	whereSql, conditions := handleTopDataCondition(c)
	sql = sql + whereSql + groupSql

	err := database.DBConn.Select(&top5BuyGoods, sql, conditions...)

	if err != nil {
		fmt.Println("查询失败", err.Error(), sql)
	}

	return top5BuyGoods
}

func GetTop5SellGoods(c *fiber.Ctx) []STATISTICS {
	var top5SellGoods []STATISTICS
	//  卖的最多 top 5
	sql := "select  name,sum(sellPrice*number) money from t_order "
	whereSql, conditions := handleTopDataCondition(c)
	groupSql := " group by name order by money desc limit 5"
	sql = sql + whereSql + groupSql

	err := database.DBConn.Select(&top5SellGoods, sql, conditions...)

	if err != nil {
		fmt.Println("查询失败", err.Error(), sql)
	}

	return top5SellGoods
}

func GetTop5ProfitGoods(c *fiber.Ctx) []STATISTICS {
	var top5ProfitGoods []STATISTICS
	// GoodsProfitTop5 利润最高 top 5
	sql := "select  name,sum(sellPrice*number - buyPrice*number - otherCost) money from t_order"
	whereSql, conditions := handleTopDataCondition(c)
	groupSql := " group by name order by money desc limit 5"
	sql = sql + whereSql + groupSql

	err := database.DBConn.Select(&top5ProfitGoods, sql, conditions...)

	if err != nil {
		fmt.Println("查询失败", err.Error(), sql)
	}

	return top5ProfitGoods
}

func GetTop5BuyCustomer(c *fiber.Ctx) []STATISTICS {
	var top5BuyCustomers []STATISTICS
	// ProfitTop5 赚的最多的客户
	sql := "select contact name,sum(sellPrice*number - buyPrice*number - otherCost) money from t_order"
	groupSql := " group by contact order by money desc limit 5"
	whereSql, conditions := handleTopDataCondition(c)
	sql = sql + whereSql + groupSql

	err := database.DBConn.Select(&top5BuyCustomers, sql, conditions...)

	if err != nil {
		fmt.Println("查询失败", err.Error(), sql)
	}

	return top5BuyCustomers
}

func GetOrderById(c *fiber.Ctx, id int) (model.Order, error) {
	var order model.Order

	e := database.GetById(c, "t_order", id, &order)

	if e != nil {
		return order, errors.New("查找不到数据")
	}

	return order, nil
}

func DeleteOrder(c *fiber.Ctx, id string) error {
	e := database.DeleteById(c, "t_order", id)

	if e != nil {
		return errors.New("删除订单失败")
	}

	return nil
}
