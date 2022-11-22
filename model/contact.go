package model

// User struct
type Contact struct {
	Id         string  `db:"id" json:"id"`
	Name       string  `db:"name" json:"name"`
	Phone      string  `db:"phone" json:"phone"`
	Address    string  `db:"address" json:"address"`
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}
