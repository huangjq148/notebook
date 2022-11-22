package model

// Product struct
type Product struct {
	// 对应 id 表字段
	Id int `db:"id" json:"id"`
	// 对应 name 表字段
	Name string `db:"name" json:"name"`
	// 进价
	BuyPrice string `db:"buyPrice" json:"buyPrice"`
	// 售价
	SellPrice  string  `db:"sellPrice" json:"sellPrice"`
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}
