package api

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func CreateCalculator(c *fiber.Ctx) error {
	var calculator model.Calculator

	if err := c.BodyParser(&calculator); err != nil {
		return err
	}

	database.Create(c, "t_calculator", calculator)

	return c.JSON(response.Success(nil, "创建成功"))
}

func QueryCalculatorList(c *fiber.Ctx) error {
	type CalculatorCondition struct {
		Table string `table:"t_calculator"`
		Date  string `db:"date" json:"date" op:"like"`
	}
	var queryResult []model.Calculator

	result, e := database.QueryPage(c, &queryResult, CalculatorCondition{})

	if e != nil {
		return c.JSON(response.Error(e.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

func GetCalculatorById(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	var calculator model.Calculator

	err = database.GetById(c, "t_calculator", id, &calculator)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(calculator, "查询成功"))
}

func DeleteCalculator(c *fiber.Ctx) error {
	id := c.Params("id")

	err := database.DeleteById(c, "t_calculator", id)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(nil, "删除成功"))
}

func UpdateCalculator(c *fiber.Ctx) error {

	var calculator model.Calculator

	if err := c.BodyParser(&calculator); err != nil {
		return err
	}

	_, err := database.Update(c, "t_calculator", calculator)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(nil, "更新成功"))
}
