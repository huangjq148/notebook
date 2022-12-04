package services

import (
	"api-fiber-gorm/database"
	"api-fiber-gorm/model"
	"errors"
	"fmt"
)

func GetOrderById(id int) (model.Order, error) {
	sql := "select * from t_order where id = ?"
	var order model.Order

	e := database.DBConn.Get(&order, sql, id)

	fmt.Println(sql, id, order)
	if e != nil {
		return order, errors.New("查找不到数据")
	}

	return order, nil
}

func DeleteOrder(userId string, id string) error {
	e := database.DeleteById("t_order", userId, id)

	if e != nil {
		return errors.New("删除订单失败")
	}

	return nil
}
