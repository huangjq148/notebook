package api

import (
	"fmt"
	"hjq-notebook/internal/config"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/utils"
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

	if err := c.BodyParser(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"status": "error", "message": "Error on login request", "data": err})
	}

	var accountInfo Account

	// roles 列在老库可能不存在：只有启动探测到该列时才查询，避免 Unknown column 直接 500。
	// 探测结果由 database.EnsureRoleSupport() 在 main.go 里缓存。
	loginSql := "select id,userId,username from t_user_account where username=? and password=?"
	if database.RoleColumnReady() {
		loginSql = "select id,userId,username,roles from t_user_account where username=? and password=?"
	}

	e := db.Get(&accountInfo, loginSql, input.Username, input.Password)

	// 兜底：探测通过但列实际不存在（例如运行期被 DROP）时识别 MySQL 1054，
	// 降级重试一次不带 roles 的 SQL，保证登录绝不 500。
	if e != nil && database.RoleColumnReady() && database.IsUnknownColumnError(e) {
		database.MarkRoleColumnMissing()
		fmt.Println("[warn] [角色] 查询 t_user_account.roles 失败（1054），已降级为无角色模式，" +
			database.RoleColumnHint)
		e = db.Get(&accountInfo, "select id,userId,username from t_user_account where username=? and password=?", input.Username, input.Password)
	}

	if e != nil {
		fmt.Println("err=", e)
		return c.JSON(fiber.Map{"status": "error", "message": "用户名或密码错误"})
	}

	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	// token 中的 user_id 会被当作 t_user.id 使用，优先取账号关联的 userId
	userId := accountInfo.UserId
	if userId == "" {
		userId = accountInfo.Id
	}
	claims["username"] = accountInfo.Username
	claims["user_id"] = userId
	// roles 用逗号串（与库里存储格式一致）；为空/缺失一律回落 user，
	// 保证「角色信息缺失」不会变成「无限制」。
	roles := utils.NormalizeRoles(accountInfo.Roles)
	claims["roles"] = roles
	claims["exp"] = time.Now().Add(time.Hour * 24 * 30).Unix()

	t, err := token.SignedString([]byte(config.Config("SECRET")))
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.JSON(fiber.Map{"status": "success", "data": fiber.Map{"userId": userId, "access_token": t, "roles": roles}})
}
