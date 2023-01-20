package contact

import (
	"fmt"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

func SearchContact(c *fiber.Ctx) error {
	db := database.DBConn
	name := c.Query("name")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	queryResult := []model.Contact{}

	e := db.Select(&queryResult, "select * from t_contact where createUser=? and realname like ?", userId, "%"+name+"%")

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": queryResult})
}

func CreateContact(c *fiber.Ctx) error {
	db := database.DBConn
	var contact model.Contact
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&contact); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_contact(realname, phone, address,createTime,createUser) values(?,?,?,?,?)",
		contact.Name, contact.Phone, contact.Address, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

type ContactQuery struct {
	Id         string  `db:"id" json:"id"`
	Name       string  `db:"realname" json:"name" form:"name;required"`
	Phone      string  `db:"phone" json:"phone" `
	Address    string  `db:"address" json:"address" form:"address"`
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}

func QueryContactList(c *fiber.Ctx) error {
	type ContactQueryCondition struct {
		Table   string `table:"t_contact"`
		Name    string `db:"name" json:"name" op:"like"`
		Address string `db:"address" json:"address" op:"like"`
		Phone   string `db:"phone" json:"phone" op:"like"`
	}

	var queryResult []model.Contact

	result, e := database.QueryPage(c, &queryResult, ContactQueryCondition{})

	if e != nil {
		return c.JSON(response.Error(e.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

func DeleteContact(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	result, e := db.Exec("delete from t_contact where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "删除成功", "data": result})
}

func GetContactById(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var contact model.Contact

	e := db.Get(&contact, "select * from t_contact where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "查询成功", "data": contact})
}

func UpdateContact(c *fiber.Ctx) error {
	db := database.DBConn
	var contact model.Contact

	if err := c.BodyParser(&contact); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("update t_contact set realname=?, phone=?, address=? where id=?", contact.Name, contact.Phone, contact.Address, contact.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
