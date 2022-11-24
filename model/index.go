package model

type CreateInfo struct {
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}

type Order struct {
	Id        int    `db:"id" json:"id"`
	Name      string `db:"name" json:"name"`
	Contact   string `db:"contact" json:"contact"`
	Phone     string `db:"phone" json:"phone"`
	Address   string `db:"address" json:"address"`
	BuyPrice  string `db:"buyPrice" json:"buyPrice"`
	SellPrice string `db:"sellPrice" json:"sellPrice"`
	Number    string `db:"number" json:"number"`
	Remark    string `db:"remark" json:"remark"`
	Status    string `db:"status" json:"status"`
	*CreateInfo
}

type Contact struct {
	Id      string `db:"id" json:"id"`
	Name    string `db:"realname" json:"name" form:"name;required"`
	Phone   string `db:"phone" json:"phone" `
	Address string `db:"address" json:"address" form:"address"`
	*CreateInfo
}

type Product struct {
	// 对应 id 表字段
	Id int `db:"id" json:"id"`
	// 对应 name 表字段
	Name string `db:"name" json:"name"`
	// 进价
	BuyPrice string `db:"buyPrice" json:"buyPrice"`
	// 售价
	SellPrice string `db:"sellPrice" json:"sellPrice"`
	*CreateInfo
}

type Stock struct {
	// 对应 id 表字段
	Id int `db:"id" json:"id"`
	// 对应 name 表字段
	Name string `db:"name" json:"name"`
	// 进价
	BuyPrice string `db:"buyPrice" json:"buyPrice"`
	// 售价
	SellPrice string `db:"sellPrice" json:"sellPrice"`
	// 库存数量
	Number string `db:"number" json:"number"`
	*CreateInfo
}

type User struct {
	// 对应 id 表字段
	Id int `db:"id" json:"id"`
	// 对应 name 表字段
	Name string `db:"realname" json:"name"`
	// 对应 sex 表字段
	Sex *string `db:"sex" json:"sex"`
	// 对应 avatar 表字段
	*CreateInfo
}

type Account struct {
	// 对应id表字段
	Id string `db:"id"`
	// 对应name表字段
	Username string `db:"username" json:"username" form:"username"`
	// 对应age表字段
	Password string `db:"password" json:"password"`
	// 对应rmb表字段
	UserId string `db:"userId" json:"userId"`
	*CreateInfo
}
