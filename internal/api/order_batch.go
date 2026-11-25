package api

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model/response"
	"hjq-notebook/internal/oplog"
	"hjq-notebook/internal/services"
	"hjq-notebook/internal/utils"
)

func CreateOrderBatch(c *fiber.Ctx) error {
	var request struct {
		RequestID string                `json:"requestId"`
		Orders    []services.BatchOrder `json:"orders"`
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(response.Error("批量订单参数格式错误"))
	}
	userID := utils.GetUserId(c)
	if userID == "" {
		return c.Status(401).JSON(response.Error("请先登录"))
	}
	result, err := services.CreateOrdersBatch(c.UserContext(), database.DBConn, userID, request.RequestID, request.Orders)
	if err != nil {
		var validation *services.BatchValidationError
		if errors.As(err, &validation) {
			return c.Status(400).JSON(response.Error(err.Error()))
		}
		if errors.Is(err, services.ErrBatchConflict) {
			return c.Status(409).JSON(response.Error(err.Error()))
		}
		log.Printf("[批量订单] 保存失败: %v", err)
		return c.Status(500).JSON(response.Error("批量保存未确认成功，请保留当前内容并重试；同一提交不会重复创建订单"))
	}
	oplog.SetAction(c, "create")
	oplog.SetTargetID(c, request.RequestID)
	if !result.Replayed {
		oplog.SetSnapshot(c, nil, fiber.Map{"orders": request.Orders, "orderIds": result.OrderIDs})
	}
	return c.JSON(response.Success(result, "批量保存成功"))
}
