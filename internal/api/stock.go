package api

import (
	"errors"
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/oplog"
	"hjq-notebook/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

// 库存快照查询：number 在库里是 float，而 model.Stock.Number 是 string，
// 直接 select * 会扫描失败，这里 CAST 成字符串（NULL 兜底为空串）后再进快照。
const stockSnapshotSql = "select id,name,buyPrice,sellPrice,IFNULL(CAST(number AS CHAR),'') as number," +
	"createUser,updateUser,createTime,updateTime from t_stock where id=?"

type StockQueryCondition struct {
	Table string `table:"t_stock"`
	Name  string `db:"name" json:"name" op:"like"`
}

func CreateStock(c *fiber.Ctx) error {
	db := database.DBConn
	var stock model.Stock
	userId := utils.GetUserId(c)

	if err := c.BodyParser(&stock); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_stock(name, buyPrice,sellPrice, number, createTime,createUser) values(?,?,?,?,?,?)",
		stock.Name, stock.BuyPrice, stock.SellPrice, stock.Number, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	// 操作日志：新增只记改后数据；能拿到自增主键就把它作为目标 ID
	oplog.SetSnapshot(c, nil, stock)
	if id, e := result.LastInsertId(); e == nil {
		oplog.SetTargetID(c, id)
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

// Statistics 统计订单信息
func Statistics(c *fiber.Ctx) error {
	type StatisticsInfo struct {
		BuyMoney  string `db:"buyMoney" json:"buyMoney"`
		SellMoney string `db:"sellMoney" json:"sellMoney"`
		Number    string `db:"number" json:"number"`
	}

	var result StatisticsInfo
	userId := utils.GetUserId(c)

	tableName, whereSql, conditions := database.GenerateSql(c, StockQueryCondition{})

	sql := "select IFNULL(sum(buyPrice * number),0) buyMoney,IFNULL(sum(sellPrice * number),0) sellMoney, IFNULL(sum(number),0) number from " + tableName + " where 1=1 and createUser=" + userId + " " + whereSql

	db := database.DBConn

	if e := db.Get(&result, sql, conditions...); e != nil {
		return c.JSON(fiber.Map{"status": "fail", "message": "查询失败"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": result})
}

func QueryStockList(c *fiber.Ctx) error {
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
	userId := utils.GetUserId(c)

	// 操作日志：删除前保留旧库存
	var before model.Stock
	if e := db.Get(&before, stockSnapshotSql, id); e == nil {
		oplog.SetSnapshot(c, before, nil)
	}

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
	userId := utils.GetUserId(c)
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

	// 操作日志：更新前取旧记录，和请求体形成改前/改后对照
	var before model.Stock
	if e := db.Get(&before, stockSnapshotSql, stock.Id); e == nil {
		oplog.SetSnapshot(c, before, stock)
	} else {
		oplog.SetSnapshot(c, nil, stock)
	}

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
