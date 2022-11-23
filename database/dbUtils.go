package database

import (
	"fmt"
	"reflect"
)

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
