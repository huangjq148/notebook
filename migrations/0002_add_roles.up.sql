-- 0002：为 t_user_account 增加 roles 列（老库升级）。
-- 列已存在时不重复添加，保证迁移可重复执行；默认值为 'user'。

SET @roles_column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 't_user_account'
    AND column_name = 'roles'
);

SET @add_roles_ddl := IF(
  @roles_column_exists = 0,
  'ALTER TABLE `t_user_account` ADD COLUMN `roles` varchar(200) NOT NULL DEFAULT ''user''',
  'DO 0'
);

PREPARE add_roles_stmt FROM @add_roles_ddl;
EXECUTE add_roles_stmt;
DEALLOCATE PREPARE add_roles_stmt;
