package database

import (
	"api-fiber-gorm/utils"
	"fmt"
	"github.com/gofiber/fiber/v2"
	"reflect"
	"strconv"
	"strings"
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

func Create(c *fiber.Ctx, tableName string, data interface{}) error {
	//db := DBConn
	//token := c.Get("Authorization")
	//userId := utils.GetFromToken(token, "user_id")
	if err := c.BodyParser(&data); err != nil {
		return err
	}

	v := reflect.ValueOf(data)
	fmt.Println(v)
	typeOfData := reflect.TypeOf(data)
	fieldLen := typeOfData.NumField()
	conditions := make([]interface{}, 0)
	conditionNames := make([]string, 0)

	for i := 0; i < fieldLen; i++ {
		tag := typeOfData.Field(i).Tag
		if c.Query(tag.Get("json")) != "" {
			conditions = append(conditions, c.Query(tag.Get("json")))
			conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
		}
	}

	sql := "insert into " + tableName + "(" + ") values(" + ")"
	fmt.Println(sql)
	//result, e := db.Exec("insert into t_order(name, contact, phone, address, buyPrice, sellPrice , number, otherCost, status, remark, stockId, createTime, createUser) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",
	//	order.Name, order.Contact, order.Phone, order.Address, order.BuyPrice, order.SellPrice, order.Number, order.OtherCost, order.Status, order.Remark, order.StockId, time.Now().Format("2006-01-02"), userId)

	//if e != nil {
	//	fmt.Println("err=", e)
	//	return c.JSON(fiber.Map{"status": "error", "message": e.Error()})
	//}

	return nil
}

func generateSql(c *fiber.Ctx, data interface{}) (string, string, []interface{}) {
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
				break
			case "=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
				break
			case "<=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
				break
			case ">=":
				conditions = append(conditions, c.Query(tag.Get("json")))
				conditionNames = append(conditionNames, " and "+tag.Get("db")+" "+tag.Get("op")+"?")
				break
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

	tableName, whereSql, conditions := generateSql(c, data)

	sql := "select * from " + tableName + " where 1=1 and createUser=" + userId + " " + whereSql + orderSql + pageSql

	e := db.Select(queryResult, sql, conditions...)

	if e != nil {
		fmt.Println("err=", e)
		return nil, e
	}

	countSql := "select count(1) from " + tableName + whereSql

	db.Get(&count, countSql, conditions...)

	return fiber.Map{"content": queryResult, "total": count}, nil
}

func DeleteById(tableName, userId, id string) error {
	sql := "delete from " + tableName + " where 1=1 and createUser=? and id=?"

	_, e := DBConn.Exec(sql, userId, id)

	if e != nil {
		return e
	}
	return nil
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
