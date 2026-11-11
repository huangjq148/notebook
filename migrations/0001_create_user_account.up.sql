-- 0001：建立登录依赖的 t_user_account 基础表（新库）。
-- 老库已有该表时本脚本不做任何修改，避免覆盖线上数据。
-- 注意：password 使用 varchar(255) 以容纳 bcrypt 哈希（老库的 varchar(30) 保持原样）。

CREATE TABLE IF NOT EXISTS `schema_migration_flags` (
  `name` varchar(64) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @account_table_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 't_user_account'
);

CREATE TABLE IF NOT EXISTS `t_user_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(30) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `userId` varchar(40) DEFAULT NULL,
  `createUser` int DEFAULT 0,
  `updateUser` int DEFAULT 0,
  `createTime` varchar(20) DEFAULT NULL,
  `updateTime` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 记录「表是本迁移创建的」，down 时只删除自己创建的表，绝不误删老库存量表。
INSERT IGNORE INTO `schema_migration_flags` (`name`)
SELECT '0001_created_t_user_account' FROM DUAL WHERE @account_table_exists = 0;
