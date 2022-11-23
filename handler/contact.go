package handler

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"api-fiber-gorm/utils"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateContact(c *fiber.Ctx) error {
	db := database.DBConn
	var contact model.Contact
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	if err := c.BodyParser(&contact); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	}

	result, e := db.Exec("insert into t_contacts(realname, phone, address,createTime,createUser) values(?,?,?,?,?)",
		contact.Name, contact.Phone, contact.Address, time.Now().Format("2006-01-02"), userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": result})
}

func QueryContactList(c *fiber.Ctx) error {
	db := database.DBConn
	// var product model.Product
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var queryResult []model.Contact

	// if err := c.BodyParser(&product); err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "参数格式错误", "data": err})
	// }

	e := db.Select(&queryResult, "select * from t_contacts where 1=1 and createUser=?", userId)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "参数格式错误"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "保存成功", "data": queryResult})
}

func DeleteContact(c *fiber.Ctx) error {
	db := database.DBConn
	id := c.Params("id")
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	result, e := db.Exec("delete from t_contacts where 1=1 and createUser=? and id=?", userId, id)

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

	e := db.Get(&contact, "select * from t_contacts where 1=1 and createUser=? and id=?", userId, id)

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

	database.GetById(contact)

	result, e := db.Exec("update t_contacts set realname=?, phone=?, address=? where id=?", contact.Name, contact.Phone, contact.Address, contact.Id)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "修改失败", "data": e})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "修改成功", "data": result})
}
