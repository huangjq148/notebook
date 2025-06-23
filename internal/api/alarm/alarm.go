package alarm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type AlarmCondition struct {
	Table string `table:"t_alarm"`
	// Name  string `db:"name" json:"name" op:"like"`
}

type TextContent struct {
	Content string `json:"content"`
}

type Message struct {
	Msgtype string      `json:"msgtype"`
	Text    TextContent `json:"text"`
}

func Send(data interface{}) (string, []byte) {
	// Define the webhook URL
	url := "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a3faa36b-f388-45a2-981d-0c9b7c611f80"

	// 准备要发送的数据
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

	if resp.Status == "200" {
		return "success", body
	} else {
		return "error", body
	}

}

func SendMessageToWeChatWebhook(c *fiber.Ctx) error {
	data := Message{
		Msgtype: "text",
		Text: TextContent{
			Content: "Hi，我是机器人通知群\n由黄坚强于06月16日添加到群",
		},
	}
	status, body := Send(data)

	if status == "200" {
		return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": body})
	} else {
		return c.JSON(fiber.Map{"status": "error", "message": "保存失败", "data": body})
	}
}

func CreateAlarm(c *fiber.Ctx) error {
	var alarm model.Alarm

	if err := c.BodyParser(&alarm); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	database.Create(c, "t_alarm", alarm)

	return c.JSON(response.Success(nil, "创建成功"))
}

func QueryAlarmList(c *fiber.Ctx) error {
	var queryResult []model.Alarm

	result, e := database.QueryPage(c, &queryResult, AlarmCondition{})

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(response.Success(result, "查询成功"))
}

func DeleteAlarm(c *fiber.Ctx) error {
	id := c.Params("id")

	database.DeleteById(c, "t_alarm", id)

	return c.JSON(fiber.Map{"status": "success", "message": "删除成功"})
}
