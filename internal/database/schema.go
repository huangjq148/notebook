package database

import "fmt"

// 业务基础表结构。
// 线上库（如 tplace_release）可能只建了库、缺少业务表，导致
// "Error 1146: Table 'xxx.t_user_account' doesn't exist" 之类的报错。
// 这里在启动时统一用 IF NOT EXISTS 兜底创建，不会影响已有表和数据。
var baseTables = []string{
	"CREATE TABLE IF NOT EXISTS `t_user` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`realname` varchar(10) DEFAULT NULL," +
		"`sex` varchar(5) DEFAULT NULL," +
		"`createUser` int DEFAULT 0," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_user_account` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`username` varchar(30) DEFAULT NULL," +
		"`password` varchar(255) DEFAULT NULL," +
		"`userId` varchar(40) DEFAULT NULL," +
		// roles 列由版本化迁移 migrations/0002_add_roles.up.sql 添加。
		// 应用启动只做 CREATE TABLE IF NOT EXISTS 兜底，绝不对已有表执行隐式 ALTER；
		// 老库缺列时服务自动降级（登录可用，操作日志对所有人 403）。
		"`createUser` int DEFAULT 0," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)," +
		"KEY `idx_username` (`username`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_product` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`name` varchar(25) DEFAULT NULL," +
		"`buyPrice` varchar(20) DEFAULT NULL," +
		"`sellPrice` varchar(20) DEFAULT NULL," +
		"`createUser` int DEFAULT 0," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_stock` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`name` varchar(255) DEFAULT NULL," +
		"`buyPrice` varchar(20) DEFAULT NULL," +
		"`sellPrice` varchar(20) DEFAULT NULL," +
		"`number` float(20, 2) DEFAULT NULL," +
		"`createUser` int DEFAULT 0," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_contact` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`realname` varchar(20) DEFAULT NULL," +
		"`phone` varchar(15) DEFAULT NULL," +
		"`address` varchar(100) DEFAULT NULL," +
		"`createUser` int DEFAULT 0," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_order` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`name` varchar(100) DEFAULT NULL," +
		"`contact` varchar(100) DEFAULT NULL," +
		"`address` varchar(100) DEFAULT NULL," +
		"`phone` varchar(15) DEFAULT NULL," +
		"`buyPrice` varchar(20) DEFAULT '0'," +
		"`sellPrice` varchar(20) DEFAULT '0'," +
		"`number` varchar(20) DEFAULT '0'," +
		"`remark` varchar(255) DEFAULT NULL," +
		"`status` varchar(1) DEFAULT NULL," +
		"`createUser` int DEFAULT NULL," +
		"`updateUser` int DEFAULT 0," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"`stockId` int DEFAULT NULL," +
		"`otherCost` varchar(10) DEFAULT NULL," +
		"`orderTime` varchar(40) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

	"CREATE TABLE IF NOT EXISTS `t_alarm` (" +
		"`id` int NOT NULL AUTO_INCREMENT," +
		"`title` varchar(255) DEFAULT NULL," +
		"`date` varchar(255) DEFAULT NULL," +
		"`time` varchar(255) DEFAULT NULL," +
		"`description` varchar(255) DEFAULT NULL," +
		"`isEnable` varchar(1) DEFAULT NULL," +
		"`isRepeat` varchar(1) DEFAULT NULL," +
		"`createUser` int DEFAULT NULL," +
		"`updateUser` int DEFAULT NULL," +
		"`createTime` varchar(20) DEFAULT NULL," +
		"`updateTime` varchar(20) DEFAULT NULL," +
		"PRIMARY KEY (`id`)" +
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
}

// EnsureSchema 确保业务基础表存在，缺表时自动创建。
func EnsureSchema() error {
	if DBConn == nil {
		return fmt.Errorf("database not connected")
	}

	for _, stmt := range baseTables {
		if _, err := DBConn.Exec(stmt); err != nil {
			return err
		}
	}

	var count int
	if err := DBConn.Get(&count, "select count(*) from t_user_account"); err == nil && count == 0 {
		fmt.Println("[warn] t_user_account 表为空，无法登录。请先执行 go run ./cmd/migrate up 初始化，或导入账号数据（参考 resources/notebook.sql）")
	}
	return nil
}
