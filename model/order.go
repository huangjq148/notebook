package model

// User struct
type Order struct {
	Username   string  `gorm:"unique_index;not null" json:"username"`
	Email      string  `gorm:"unique_index;not null" json:"email"`
	Password   string  `gorm:"not null" json:"password"`
	Names      string  `json:"names"`
	CreateUser *string `db:"createUser" json:"createUser"`
	UpdateUser *string `db:"updateUser" json:"updateUser"`
	CreateTime *string `db:"createTime" json:"createTime"`
	UpdateTime *string `db:"updateTime" json:"updateTime"`
}
