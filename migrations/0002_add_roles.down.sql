-- 0002 回滚：删除本迁移引入的 roles 列。
-- 列不存在时保持幂等（例如手工删除过该列）。

SET @roles_column_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 't_user_account'
    AND column_name = 'roles'
);

SET @drop_roles_ddl := IF(
  @roles_column_exists > 0,
  'ALTER TABLE `t_user_account` DROP COLUMN `roles`',
  'DO 0'
);

PREPARE drop_roles_stmt FROM @drop_roles_ddl;
EXECUTE drop_roles_stmt;
DEALLOCATE PREPARE drop_roles_stmt;
