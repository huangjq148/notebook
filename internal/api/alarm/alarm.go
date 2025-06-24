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
	"strconv"

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

	if resp.StatusCode == 200 {
		return "success", body
	} else {
		return "error", body
	}

}

func SendMessageToWeChatWebhook(c *fiber.Ctx) error {
	id := c.Query("id")
	var alarmInfo model.Alarm

	if id != "" {
		intId, err := strconv.Atoi(id)
		if err != nil {
			return c.JSON(response.Error("id 错误"))
		}
		database.GetById(c, "t_alarm", intId, &alarmInfo)
	}

	data := Message{
		Msgtype: "text",
		Text: TextContent{
			Content: alarmInfo.Title,
		},
	}
	status, body := Send(data)

	if status == "success" {
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

func UpdateAlarm(c *fiber.Ctx) error {
	id := c.Params("id")
	var alarm model.Alarm

	if err := c.BodyParser(&alarm); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	if id == "" {
		return c.JSON(fiber.Map{"status": "error", "message": "ID不能为空"})
	}

	intId, err := strconv.Atoi(id)
	if err != nil {
		return c.JSON(fiber.Map{"status": "error", "message": "ID格式错误"})
	}

	alarm.Id = intId
	database.Update(c, "t_alarm", alarm)

	return c.JSON(response.Success(nil, "更新成功"))
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
