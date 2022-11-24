package database

import (
	"fmt"
	"reflect"
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

func AddCondition(obj GenerateWhereSql, key string, value string) GenerateWhereSql {
	obj.AddParam(key, value)
	return obj
}

func GetConditions(obj GenerateWhereSql) (string, []interface{}) {
	return obj.getData()
}

// Example
// var queryResult []model.Contact
// database.QueryPage(c, &queryResult, model.Contact{})
func QueryPage(c *fiber.Ctx, queryResult, data interface{}) {
	db := DBConn
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	conditions := make([]interface{}, 0)
	sql := "select * from t_contacts where 1=1"
	conditionNames := ""

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag
		needAdd := false

		if c.Query(tag.Get("json")) != "" {
			needAdd = true
			conditions = append(conditions, c.Query(tag.Get("json")))
		}

		if needAdd {
			conditionNames = conditionNames + " and " + tag.Get("db") + "=?"
		}
	}

	sql = sql + conditionNames

	e := db.Select(queryResult, sql, conditions...)

	if e != nil {
		fmt.Println("err=", e)
	}
	fmt.Println("result=", queryResult, sql, conditions)
}

func GetById(data interface{}) {

	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	values := reflect.ValueOf(data)

	for i := 0; i < fieldLen; i++ {
		fieldName := typeOfData.Field(i).Name
		fieldValue := values.Field(i)

		fmt.Println(fieldName, fieldValue)
	}

	// veggies := []string{"potatoes", "tomatoes", "brinjal"}
	// fruits := []string{"oranges", "apples"}
	// food := append(veggies, fruits...)
	// fmt.Println("food:", foodfruits...)

	// v := reflect.ValueOf(data)
	// count := v.NumField()
	// for i := 0; i < count; i++ {
	// 	f := v.Field(i) //字段值
	// 	switch f.Kind() {
	// 	case reflect.String:
	// 		fmt.Println(f.String())
	// 	case reflect.Int:
	// 		fmt.Println(f.Int())
	// 	}
	// }
	// fmt.Println(data, 1112)
}
