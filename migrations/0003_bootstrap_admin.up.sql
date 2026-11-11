-- 0003：初始化管理员 huangjq。
--
-- 规则：
--   * 账号不存在：按 ADMIN_INIT_PASSWORD 生成 bcrypt 哈希后创建，roles=admin,user；
--     迁移工具会把 {{ADMIN_INIT_PASSWORD_HASH}} 替换为真实 bcrypt 哈希，
--     日志与脚本中都不会出现明文密码。
--   * 账号已存在：只补 roles，绝不覆盖既有 password 及其它字段（兼容老库明文/历史哈希）。
--
-- createTime/updateTime 沿用项目既有 varchar(20) 约定；老库记录保持不变。

SET @huangjq_exists := (
  SELECT COUNT(*) FROM `t_user_account` WHERE `username` = 'huangjq'
);

INSERT INTO `t_user_account`
  (`username`, `password`, `userId`, `roles`, `createUser`, `updateUser`, `createTime`, `updateTime`)
SELECT
  'huangjq', '{{ADMIN_INIT_PASSWORD_HASH}}', '1', 'admin,user', 1, 1, NULL, NULL
FROM DUAL
WHERE @huangjq_exists = 0;

-- 记录「账号由本迁移创建」，供 down 精确回退，避免误删老库既有账号。
INSERT IGNORE INTO `schema_migration_flags` (`name`)
SELECT '0003_created_huangjq' FROM DUAL WHERE @huangjq_exists = 0;

UPDATE `t_user_account`
SET `roles` = 'admin,user'
WHERE `username` = 'huangjq'
  AND (`roles` IS NULL OR `roles` <> 'admin,user');
