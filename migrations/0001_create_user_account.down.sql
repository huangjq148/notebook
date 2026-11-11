-- 0001 回滚：仅当 t_user_account 是本迁移在空库上创建时才删除。
-- 老库（迁移前已存在表）保持不动，防止回滚误删存量账号。

SET @created_by_migration := (
  SELECT COUNT(*) FROM `schema_migration_flags`
  WHERE `name` = '0001_created_t_user_account'
);

SET @down_ddl := IF(
  @created_by_migration > 0,
  'DROP TABLE IF EXISTS `t_user_account`',
  'DO 0'
);

PREPARE down_stmt FROM @down_ddl;
EXECUTE down_stmt;
DEALLOCATE PREPARE down_stmt;

DELETE FROM `schema_migration_flags` WHERE `name` = '0001_created_t_user_account';
DROP TABLE IF EXISTS `schema_migration_flags`;
