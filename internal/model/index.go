package model

type CreateInfo struct {
	CreateUser int     `db:"createUser" json:"createUser"`
	UpdateUser *int    `db:"updateUser" json:"updateUser"`
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
	OtherCost string `db:"otherCost" json:"otherCost"`
	Remark    string `db:"remark" json:"remark"`
	Status    string `db:"status" json:"status"`
	StockId   int    `db:"stockId" json:"stockId"`
	OrderTime string `db:"orderTime" json:"orderTime"`
	*CreateInfo
}

type Contact struct {
	Id      string `db:"id" json:"id"`
	Name    string `db:"realname" json:"realname" form:"realname;required"`
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
	Name string `db:"realname" json:"realname"`
	// 对应 sex 表字段
	Sex      *string `db:"sex" json:"sex"`
	Username string  `json:"username"`
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

type Alarm struct {
	// 对应id表字段
	Id int `db:"id" json:"id"`
	// 标题
	Title string `db:"title" json:"title" form:"title"`
	// 时间 - 日期
	Date string `db:"date" json:"date"`
	// 时间 - 小时
	Time string `db:"time" json:"time"`
	// 备注
	Description string `db:"description" json:"description"`
	// 是否重复
	IsRepeat string `db:"isRepeat" json:"isRepeat"`
	// 是否启用
	IsEnable string `db:"isEnable" json:"isEnable"`
	*CreateInfo
}

type StudentWork struct {
	Id      int    `db:"id" json:"id"`
	Date    string `db:"date" json:"date"`
	Content string `db:"content" json:"content"`
	*CreateInfo
}

type Calculator struct {
	Id          int    `db:"id" json:"id"`
	Operations  string `db:"operations" json:"operations"`
	AnswerRange int    `db:"answerRange" json:"answerRange"`
	Count       int    `db:"count" json:"count"`
	Content     string `db:"content" json:"content"`
	*CreateInfo
}
