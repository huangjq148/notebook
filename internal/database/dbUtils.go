package database

import (
	"errors"
	"fmt"
	"hjq-notebook/internal/utils"
	"reflect"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type GenerateWhereSql struct {
	paramKeys   []string
	paramValues []interface{}
}

func (g *GenerateWhereSql) AddParam(key string, value interface{}) {
	g.paramKeys = append(g.paramKeys, key)
	g.paramValues = append(g.paramValues, value)
}

func (g *GenerateWhereSql) getData() (string, []interface{}) {
	if len(g.paramKeys) == 0 {
		return "", nil
	}
	return strings.Join(g.paramKeys, " AND "), g.paramValues
}

// -----------------------------------------------------------------------------
// Create
// -----------------------------------------------------------------------------
func Create(c *fiber.Ctx, tableName string, data interface{}) error {
	if tableName == "" {
		return errors.New("tableName 不能为空")
	}

	userId := utils.GetUserId(c)
	now := utils.GetNow()

	// 解析请求体为 map
	dataMap := make(map[string]interface{})
	if err := c.BodyParser(&dataMap); err != nil {
		return fmt.Errorf("解析请求体失败: %w", err)
	}

	t := reflect.TypeOf(data)
	fieldLen := t.NumField()

	var cols []string
	var placeholders []string
	var values []interface{}

	for i := 0; i < fieldLen; i++ {
		field := t.Field(i)
		dbTag := field.Tag.Get("db")
		jsonTag := field.Tag.Get("json")

		if dbTag == "" || dbTag == "id" {
			continue
		}

		val, ok := dataMap[jsonTag]
		if !ok {
			val = nil
		}

		cols = append(cols, dbTag)
		placeholders = append(placeholders, "?")
		values = append(values, val)
	}

	// 公共字段
	cols = append(cols, "createTime", "createUser")
	placeholders = append(placeholders, "?", "?")
	values = append(values, now, userId)

	sql := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		tableName, strings.Join(cols, ","), strings.Join(placeholders, ","))

	if _, err := DBConn.Exec(sql, values...); err != nil {
		return fmt.Errorf("插入失败: %w", err)
	}

	return nil
}

// -----------------------------------------------------------------------------
// UpdateEntity
// -----------------------------------------------------------------------------
func UpdateEntity(c *fiber.Ctx, tableName string, data interface{}) (interface{}, error) {
	userId := utils.GetUserId(c)
	now := utils.GetNow()
	t := reflect.TypeOf(data)
	v := reflect.ValueOf(data)
	fieldLen := t.NumField()

	var id string
	var sets []string
	var values []interface{}

	for i := 0; i < fieldLen; i++ {
		field := t.Field(i)
		dbTag := field.Tag.Get("db")
		if dbTag == "" {
			continue
		}

		val := v.Field(i).Interface()
		if dbTag == "id" {
			id = fmt.Sprintf("%v", val)
			continue
		}
		sets = append(sets, dbTag+"=?")
		values = append(values, val)
	}

	sets = append(sets, "updateUser=?", "updateTime=?")
	values = append(values, userId, now, id, userId)

	sql := fmt.Sprintf("UPDATE %s SET %s WHERE id=? AND createUser=?", tableName, strings.Join(sets, ","))

	if _, err := DBConn.Exec(sql, values...); err != nil {
		return nil, fmt.Errorf("更新失败: %w", err)
	}
	return nil, nil
}

// -----------------------------------------------------------------------------
// Update
// -----------------------------------------------------------------------------
func Update(c *fiber.Ctx, tableName string, data interface{}) (interface{}, error) {
	userId := utils.GetUserId(c)
	now := utils.GetNow()

	dataMap := make(map[string]interface{})
	if err := c.BodyParser(&dataMap); err != nil {
		return nil, fmt.Errorf("解析请求体失败: %w", err)
	}

	t := reflect.TypeOf(data)
	fieldLen := t.NumField()

	var id interface{}
	var sets []string
	var values []interface{}

	for i := 0; i < fieldLen; i++ {
		field := t.Field(i)
		dbTag := field.Tag.Get("db")
		jsonTag := field.Tag.Get("json")

		if dbTag == "" {
			continue
		}

		if dbTag == "id" {
			id = dataMap["id"]
			continue
		}

		if val, ok := dataMap[jsonTag]; ok {
			sets = append(sets, dbTag+"=?")
			values = append(values, val)
		}
	}

	if id == nil {
		return nil, errors.New("缺少 id 参数")
	}

	sets = append(sets, "updateTime=?", "updateUser=?")
	values = append(values, now, userId, id)

	sql := fmt.Sprintf("UPDATE %s SET %s WHERE id=?", tableName, strings.Join(sets, ","))

	if _, err := DBConn.Exec(sql, values...); err != nil {
		return nil, fmt.Errorf("更新失败: %w", err)
	}

	return nil, nil
}

// -----------------------------------------------------------------------------
// GenerateSql
// -----------------------------------------------------------------------------
func GenerateSql(c *fiber.Ctx, data interface{}) (string, string, []interface{}) {
	t := reflect.TypeOf(data)
	fieldLen := t.NumField()

	var tableName string
	var whereParts []string
	var values []interface{}

	for i := 0; i < fieldLen; i++ {
		field := t.Field(i)
		tableTag := field.Tag.Get("table")
		if tableTag != "" {
			tableName = tableTag
			continue
		}

		dbTag := field.Tag.Get("db")
		jsonTag := field.Tag.Get("json")
		op := field.Tag.Get("op")

		val := c.Query(jsonTag)
		if val == "" {
			continue
		}

		switch op {
		case "like":
			whereParts = append(whereParts, fmt.Sprintf("%s LIKE ?", dbTag))
			values = append(values, "%"+val+"%")
		case "=", "<=", ">=":
			whereParts = append(whereParts, fmt.Sprintf("%s %s ?", dbTag, op))
			values = append(values, val)
		}
	}

	whereSql := ""
	if len(whereParts) > 0 {
		whereSql = " AND " + strings.Join(whereParts, " AND ")
	}

	return tableName, whereSql, values
}

// -----------------------------------------------------------------------------
// GeneratePageSql
// -----------------------------------------------------------------------------
func GeneratePageSql(c *fiber.Ctx) string {
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))
	current, _ := strconv.Atoi(c.Query("current", "1"))

	if pageSize <= 0 {
		pageSize = 10
	}
	if current <= 0 {
		current = 1
	}

	offset := (current - 1) * pageSize
	return fmt.Sprintf(" LIMIT %d,%d", offset, pageSize)
}

// -----------------------------------------------------------------------------
// QueryPage
// -----------------------------------------------------------------------------
func QueryPage(c *fiber.Ctx, queryResult interface{}, data interface{}) (interface{}, error) {
	userId := utils.GetUserId(c)
	db := DBConn

	tableName, whereSql, args := GenerateSql(c, data)
	pageSql := GeneratePageSql(c)
	orderSql := " ORDER BY createTime DESC"

	sql := fmt.Sprintf("SELECT * FROM %s WHERE createUser=? %s%s%s", tableName, whereSql, orderSql, pageSql)
	args = append([]interface{}{userId}, args...)

	if err := db.Select(queryResult, sql, args...); err != nil {
		return nil, fmt.Errorf("查询失败: %w", err)
	}

	var total int
	countSql := fmt.Sprintf("SELECT COUNT(1) FROM %s WHERE createUser=? %s", tableName, whereSql)
	if err := db.Get(&total, countSql, args...); err != nil {
		return nil, fmt.Errorf("统计失败: %w", err)
	}

	return fiber.Map{"content": queryResult, "total": total}, nil
}

// -----------------------------------------------------------------------------
// DeleteById
// -----------------------------------------------------------------------------
func DeleteById(c *fiber.Ctx, tableName, id string) error {
	userId := utils.GetUserId(c)
	sql := fmt.Sprintf("DELETE FROM %s WHERE createUser=? AND id=?", tableName)
	if _, err := DBConn.Exec(sql, userId, id); err != nil {
		return fmt.Errorf("删除失败: %w", err)
	}
	return nil
}

// -----------------------------------------------------------------------------
// GetById
// -----------------------------------------------------------------------------
func GetById(c *fiber.Ctx, tableName string, id int, data interface{}) error {
	userId := utils.GetUserId(c)
	sql := fmt.Sprintf("SELECT * FROM %s WHERE id=? AND createUser=?", tableName)
	if err := DBConn.Get(data, sql, id, userId); err != nil {
		return errors.New("查找不到数据")
	}
	return nil
}

// -----------------------------------------------------------------------------
// QueryObjectBySql / QueryListBySql
// -----------------------------------------------------------------------------
func QueryObjectBySql(sql string, data interface{}, conditions ...interface{}) error {
	if err := DBConn.Get(data, sql, conditions...); err != nil {
		return errors.New("查找不到数据")
	}
	return nil
}

func QueryListBySql(sql string, data interface{}, conditions ...interface{}) error {
	if err := DBConn.Select(data, sql, conditions...); err != nil {
		return errors.New("查找不到数据")
	}
	return nil
}

//func GetById(data interface{}) {
//
//	typeOfData := reflect.TypeOf(data)
//	fieldLen := typeOfData.NumField()
//	values := reflect.ValueOf(data)
//
//	for i := 0; i < fieldLen; i++ {
//		fieldName := typeOfData.Field(i).Name
//		fieldValue := values.Field(i)
//
//		fmt.Println(fieldName, fieldValue)
//	}
//
//	// veggies := []string{"potatoes", "tomatoes", "brinjal"}
//	// fruits := []string{"oranges", "apples"}
//	// food := append(veggies, fruits...)
//	// fmt.Println("food:", foodfruits...)
//
//	// v := reflect.ValueOf(data)
//	// count := v.NumField()
//	// for i := 0; i < count; i++ {
//	// 	f := v.Field(i) //字段值
//	// 	switch f.Kind() {
//	// 	case reflect.String:
//	// 		fmt.Println(f.String())
//	// 	case reflect.Int:
//	// 		fmt.Println(f.Int())
//	// 	}
//	// }
//	// fmt.Println(data, 1112)
//}
