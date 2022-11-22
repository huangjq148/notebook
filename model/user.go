package model

// User struct
type User struct {
	// 对应 id 表字段
	Id int `db:"id" json:"id"`
	// 对应 name 表字段
	Name string `db:"realname" json:"name"`
	// 对应 sex 表字段
	Sex *string `db:"sex" json:"sex"`
	// 对应 avatar 表字段
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}
