package handler

import (
	"errors"
	"fmt"
	"hjq-notebook/database"
	"hjq-notebook/model"
	"hjq-notebook/utils"

	"github.com/gofiber/fiber/v2"
)

func queryUserInfoById(id string) (model.User, error) {
	db := database.DBConn
	var user model.User

	e := db.Get(&user, "select * from t_user where id=?", id)

	if e != nil {
		fmt.Println("err=", e)
		return user, errors.New("not data for id: " + id)
	}
	return user, nil
}

// Hello hanlde api status
func UserInfo(c *fiber.Ctx) error {
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	user, err := queryUserInfoById(userId)

	if err != nil {
		return c.JSON(fiber.Map{"status": "error", "message": err.Error()})
	} else {
		return c.JSON(fiber.Map{"status": "success", "data": user})
	}
}
