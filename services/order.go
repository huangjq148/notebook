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
	_, e := database.DBConn.Exec("delete from t_order where 1=1 and createUser=? and id=?", userId, id)

	if e != nil {
		return errors.New("删除订单失败")
	}

	return nil
}
