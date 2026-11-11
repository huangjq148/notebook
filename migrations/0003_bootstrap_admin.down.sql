-- 0003 回滚：
--   * 仅删除本迁移创建的 huangjq（通过 schema_migration_flags 精确识别），
--     老库既有账号不会被删除；
--   * 老库账号若在 up 时被补成 admin,user，则回退为普通用户 user。

SET @created_by_migration := (
  SELECT COUNT(*) FROM `schema_migration_flags`
  WHERE `name` = '0003_created_huangjq'
);

DELETE FROM `t_user_account`
WHERE `username` = 'huangjq' AND @created_by_migration > 0;

UPDATE `t_user_account`
SET `roles` = 'user'
WHERE `username` = 'huangjq' AND `roles` = 'admin,user';

DELETE FROM `schema_migration_flags` WHERE `name` = '0003_created_huangjq';
