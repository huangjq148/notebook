# 操作日志角色迁移与升级步骤

应用启动时会自动执行迁移。对已有 MySQL 数据库，部署新版本并重启服务；
再次重启可确认迁移可重复执行。服务仅在缺少列时添加
`t_user_account.roles VARCHAR(255) NOT NULL DEFAULT 'user'`，并为业务账号
`huangjq` 幂等追加 `admin` 角色，不修改其他账号已有的 roles 值。服务也会在
操作日志表不存在时创建该表。

服务启动成功后，使用 `huangjq` 重新登录，使新 JWT 携带账号 roles。旧 token
不会自动获得角色，访问操作日志仍返回 403。非管理员账号仍返回 HTTP 403 和
`没有权限`。
