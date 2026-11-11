package api

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func QueryOperationLogList(c *fiber.Ctx) error {
	page := positiveInt(c.Query("current"), 1)
	pageSize := positiveInt(c.Query("pageSize"), 10)
	if pageSize > 100 {
		pageSize = 100
	}

	var total int
	if err := database.DBConn.Get(&total, "SELECT COUNT(*) FROM t_operation_log"); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "查询操作日志失败"})
	}

	logs := make([]model.OperationLog, 0)
	offset := (page - 1) * pageSize
	query := `SELECT id, username, method, path, statusCode, ip, createTime
		FROM t_operation_log ORDER BY id DESC LIMIT ? OFFSET ?`
	if err := database.DBConn.Select(&logs, query, pageSize, offset); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"status": "error", "message": "查询操作日志失败"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"content": logs,
			"total":   total,
		},
	})
}

func positiveInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return fallback
	}
	return parsed
}
