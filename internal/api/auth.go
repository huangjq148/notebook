package api

import (
	"database/sql"
	"hjq-notebook/internal/config"
	"hjq-notebook/internal/database"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
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
	UserId     string  `db:"user_id"`
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
	// Keep the legacy lookup for existing plaintext-password accounts. Accounts
	// bootstrapped or reset by the supported flow use bcrypt and are checked by
	// loading the stored hash only when the legacy lookup does not match.
	// Alias the legacy camel-cased column to a sqlx-compatible name. Unsafe
	// tolerates drivers that report the original name despite the SQL alias.
	accountDB := db.Unsafe()
	e := accountDB.Get(&accountInfo, "select id,userId AS user_id,username from t_user_account where username=? and password=?", input.Username, input.Password)
	if e != nil {
		e = accountDB.Get(&accountInfo, "select id,userId AS user_id,username,password from t_user_account where username=?", input.Username)
		if e != nil || bcrypt.CompareHashAndPassword([]byte(accountInfo.Password), []byte(input.Password)) != nil {
			return c.JSON(fiber.Map{"status": "error", "message": "用户名或密码错误"})
		}
	}

	// Read roles separately after verifying credentials. This keeps the JWT
	// claim tied to the database value and avoids silently losing it when a
	// driver reports legacy column names differently from the query alias.
	var storedRoles sql.NullString
	if err := accountDB.Get(&storedRoles, "select roles from t_user_account where id=?", accountInfo.Id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "登录失败"})
	}
	roles := []string{}
	if storedRoles.Valid {
		roles = splitRoles(storedRoles.String)
	}

	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["username"] = accountInfo.Username
	claims["user_id"] = accountInfo.Id
	claims["roles"] = roles
	claims["exp"] = time.Now().Add(time.Hour * 24 * 30).Unix()

	t, err := token.SignedString([]byte(config.Config("SECRET")))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.JSON(fiber.Map{"status": "success", "data": fiber.Map{"userId": accountInfo.UserId, "access_token": t, "roles": roles}})
}

func splitRoles(raw string) []string {
	var roles []string
	for _, role := range strings.Split(raw, ",") {
		role = strings.TrimSpace(role)
		if role != "" {
			roles = append(roles, role)
		}
	}
	return roles
}
