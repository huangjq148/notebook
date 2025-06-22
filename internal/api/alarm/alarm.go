package alarm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/utils"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type AlarmCondition struct {
	Table string `table:"t_stock"`
	Name  string `db:"name" json:"name" op:"like"`
}

func CreateAlarm(c *fiber.Ctx) error {
	// db := database.DBConn
	// var stock model.Stock
	// token := c.Get("Authorization")
	// userId := utils.GetFromToken(token, "user_id")

	// if err := c.BodyParser(&stock); err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	// }

	// result, e := db.Exec("insert into t_stock(name, buyPrice,sellPrice, number, createTime,createUser) values(?,?,?,?,?,?)",
	// 	stock.Name, stock.BuyPrice, stock.SellPrice, stock.Number, time.Now().Format("2006-01-02"), userId)

	// if e != nil {
	// 	fmt.Println("err=", e)
	// 	return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	// }

	//
	url := "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a3faa36b-f388-45a2-981d-0c9b7c611f80"

	// 准备要发送的数据
	data := map[string]interface{}{
		"name":  "John Doe",
		"email": "john@example.com",
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Fatal("JSON编码失败:", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Fatal("请求失败:", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal("读取响应失败:", err)
	}

	log.Println("响应状态:", resp.Status)
	log.Println("响应内容:", string(body))
	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": body})
}

func QueryAlarmList(c *fiber.Ctx) error {
	var queryResult []model.Stock

	result, e := database.QueryPage(c, &queryResult, AlarmCondition{})

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

func DeleteAlarm(c *fiber.Ctx) error {
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
