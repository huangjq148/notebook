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

func (this *GenerateWhereSql) AddParam(key string, value string) {
	this.paramKeys = append(this.paramKeys, key)
	this.paramValues = append(this.paramValues, value)
}

func (this *GenerateWhereSql) getData() (string, []interface{}) {
	return strings.Join(this.paramKeys, " and "), this.paramValues
}

/** 创建 */
func Create(c *fiber.Ctx, tableName string, data interface{}) error {
	data1 := data
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	db := DBConn
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	if err := c.BodyParser(&data1); err != nil {
		return err
	}

	data2, ok := data1.(map[string]interface{})
	if !ok {
		return errors.New("转换错误")
	}

	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)
	placeholders := make([]string, 0)

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag
		dbFieldName := tag.Get("db")
		jsonName := tag.Get("json")

		if dbFieldName != "id" && dbFieldName != "" {
			value, ok := data2[jsonName]

			placeholders = append(placeholders, "?")
			conditionNames = append(conditionNames, dbFieldName)
			if ok {
				conditions = append(conditions, value)
			} else {
				conditions = append(conditions, "")
			}
		}
	}

	conditionNames = append(conditionNames, "createTime", "createUser")
	placeholders = append(placeholders, "?", "?")
	conditions = append(conditions, utils.GetNow(), userId)

	sql := "insert into " + tableName + "(" + strings.Join(conditionNames, ",") + ") values(" + strings.Join(placeholders, ",") + ") "

	fmt.Println(sql, conditions)

	result, e := db.Exec(sql, conditions...)

	if e != nil {
		fmt.Println(e)
		return errors.New("插入失败")
	}

	fmt.Println(result.LastInsertId())

	return nil
}

func UpdateEntity(c *fiber.Ctx, tableName string, data interface{}) (interface{}, error) {
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	values := reflect.ValueOf(data)
	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)
	var id string

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag
		dbName := tag.Get("db")
		if dbName == "id" {
			id = values.Field(i).String()
		} else {
			conditionNames = append(conditionNames, dbName+"=?")
			conditions = append(conditions, values.Field(i).String())
		}
	}
	conditionNames = append(conditionNames, "updateUser=?", "updateTime=?")
	conditions = append(conditions, userId, utils.GetNow())

	sql := "update " + tableName + " set " + strings.Join(conditionNames, ",") + " where id=? and createUser=?"
	conditions = append(conditions, id, userId)

	_, e := DBConn.Exec(sql, conditions...)

	if e != nil {
		fmt.Println(e.Error())
		return nil, e
	}

	return nil, nil
}

func Update(c *fiber.Ctx, tableName string, data interface{}) (interface{}, error) {
	data1 := data
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	var dataId interface{}

	if err := c.BodyParser(&data1); err != nil {
		return nil, err
	}

	data2, _ := data1.(map[string]interface{})

	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag
		dbFieldName := tag.Get("db")
		jsonName := tag.Get("json")

		if dbFieldName != "id" && dbFieldName != "" {
			value, ok := data2[jsonName]

			if ok {
				conditionNames = append(conditionNames, dbFieldName+"=?")
				conditions = append(conditions, value)
			}
		} else if dbFieldName == "id" {
			value, ok := data2["id"]

			if ok {
				dataId = value
			}
		}
	}

	conditionNames = append(conditionNames, "updateTime=?", "updateUser=?")
	conditions = append(conditions, utils.GetNow(), userId)

	sql := "update " + tableName + " set " + strings.Join(conditionNames, ",") + " where id=?"
	conditions = append(conditions, dataId)

	result, e := DBConn.Exec(sql, conditions...)
	if e != nil {
		fmt.Println(e)
		return nil, errors.New("插入失败")
	}
	fmt.Println(result.LastInsertId())

	return result, nil
}

func GenerateSql(c *fiber.Ctx, data interface{}) (string, string, []interface{}) {
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)
	var tableName string
	var whereSql string

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag

		if tag.Get("table") != "" {
			tableName = tag.Get("table")
		} else if c.Query(tag.Get("json")) != "" {
			switch tag.Get("op") {
			case "like":
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" like ? ")
				conditions = append(conditions, "%"+c.Query(tag.Get("json"))+"%")
			case "=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
			case "<=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
			case ">=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
			}
		}
	}

	whereSql = strings.Join(conditionNames, " ")

	return tableName, whereSql, conditions
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

// Example
// var queryResult []model.Contact
// database.QueryPage(c, &queryResult, model.Contact{})
func QueryPage(c *fiber.Ctx, queryResult interface{}, data interface{}) (interface{}, error) {
	db := DBConn
	var count int
	pageSql := GeneratePageSql(c)
	orderSql := " order by createTime desc"
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")

	tableName, whereSql, conditions := GenerateSql(c, data)

	sql := "select * from " + tableName + " where 1=1 and createUser=" + userId + " " + whereSql + orderSql + pageSql

	e := db.Select(queryResult, sql, conditions...)

	if e != nil {
		fmt.Println("err=", e)
		return nil, e
	}

	countSql := "select count(1) from " + tableName + " where 1=1 and createUser=" + userId + " " + whereSql

	db.Get(&count, countSql, conditions...)

	return fiber.Map{"content": queryResult, "total": count}, nil
}

func QueryList(c *fiber.Ctx) error {
	return nil
}

func DeleteById(c *fiber.Ctx, tableName, id string) error {
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	sql := "delete from " + tableName + " where 1=1 and createUser=? and id=?"

	_, e := DBConn.Exec(sql, userId, id)

	if e != nil {
		fmt.Println(e.Error())
		return e
	}
	return nil
}

func GetById(c *fiber.Ctx, tableName string, id int, data interface{}) error {
	token := c.Get("Authorization")
	userId := utils.GetFromToken(token, "user_id")
	sql := "select * from " + tableName + " where id=? and createUser=?"

	e := DBConn.Get(data, sql, id, userId)

	if e != nil {
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
