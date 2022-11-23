package handler

import (
	"api-fiber-gorm/config"
	"api-fiber-gorm/database"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
)

type Account struct {
	// 对应id表字段
	Id string `db:"id"`
	// 对应name表字段
	Username string `db:"username" json:"username" form:"username"`
	// 对应age表字段
	Password string `db:"password" json:"password"`
	// 对应rmb表字段
	Status     string  `db:"status"`
	UserId     string  `db:"userId"`
	Roles      string  `db:"roles"`
	CreateUser *string `db:"createUser"`
	CreateTime string  `db:"createTime"`
	UpdateTime string  `db:"updateTime"`
}

// Hello hanlde api status
func Login(c *fiber.Ctx) error {
	db := database.DBConn
	input := new(Account)

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Error on login request", "data": err})
	}

	var accountInfo Account
	fmt.Println("err=", c.BodyParser(accountInfo))

	e := db.Get(&accountInfo, "select id,userId,username from t_user_account where username=? and password=?", input.Username, input.Password)

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "用户名或密码错误"})
	}

	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["username"] = accountInfo.Username
	claims["user_id"] = accountInfo.Id
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()
	fmt.Println(config.Config("SECRET"))

	t, err := token.SignedString([]byte(config.Config("SECRET")))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.JSON(fiber.Map{"status": "success", "data": fiber.Map{"userId": accountInfo.UserId, "access_token": t}})
}
