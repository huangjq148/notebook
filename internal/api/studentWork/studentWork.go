package studentWork

import (
	"hjq-notebook/internal/database"
	"hjq-notebook/internal/model"
	"hjq-notebook/internal/model/response"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func CreateStudentWork(c *fiber.Ctx) error {
	var studentWork model.StudentWork

	if err := c.BodyParser(&studentWork); err != nil {
		return err
	}

	database.Create(c, "t_student_work", studentWork)

	return c.JSON(response.Success(nil, "创建成功"))
}

func QueryStudentWorkList(c *fiber.Ctx) error {
	type StudentWorkCondition struct {
		Table string `table:"t_student_work"`
		Date  string `db:"date" json:"date" op:"like"`
	}
	var queryResult []model.StudentWork

	result, e := database.QueryPage(c, &queryResult, StudentWorkCondition{})

	if e != nil {
		return c.JSON(response.Error(e.Error()))
	}

	return c.JSON(response.Success(result, "查询成功"))
}

func GetStudentWorkById(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	var studentWork model.StudentWork

	err = database.GetById(c, "t_student_work", id, &studentWork)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(studentWork, "查询成功"))
}

func DeleteStudentWork(c *fiber.Ctx) error {
	id := c.Params("id")

	err := database.DeleteById(c, "t_student_work", id)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(nil, "删除成功"))
}

func UpdateStudentWork(c *fiber.Ctx) error {

	var studentWork model.StudentWork

	if err := c.BodyParser(&studentWork); err != nil {
		return err
	}

	_, err := database.Update(c, "t_student_work", studentWork)

	if err != nil {
		return c.JSON(response.Error(err.Error()))
	}

	return c.JSON(response.Success(nil, "更新成功"))
}
