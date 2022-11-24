package utils

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type Pagination struct {
	PageSize int `json:"pageSize"`
	Current  int `json:"current"`
}

func GeneratePageSql(c *fiber.Ctx) string {
	pageSize, err := strconv.Atoi(c.Query("pageSize"))

	if err != nil {
		fmt.Println(err.Error())
		return " limit 0,10"
	}

	current, err := strconv.Atoi(c.Query("current"))

	if err != nil {
		fmt.Println(err.Error())
		return " limit 0,10"
	}

	startIndex := ((current - 1) * pageSize)

	return " limit " + strconv.Itoa(startIndex) + "," + strconv.Itoa(pageSize)
}
