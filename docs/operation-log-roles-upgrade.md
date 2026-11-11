# 操作日志角色迁移与升级步骤

应用启动时会自动执行迁移。对已有 MySQL 数据库，部署新版本并重启服务；
再次重启可确认迁移可重复执行。服务仅在缺少列时添加
`t_user_account.roles VARCHAR(255) NOT NULL DEFAULT 'user'`，将过短的
`password` 列扩展到可存储 bcrypt 哈希的长度，并为业务账号 `huangjq` 幂等追加
`admin` 角色。已有账号的密码及其他字段不会被角色迁移覆盖。服务也会在
操作日志表不存在时创建该表。

如果数据库中没有 `huangjq` 账号，服务不会猜测关联用户或设置仓库内置密码，启动会
提示缺少引导配置。部署时从受控密码管理器注入 `HUANGJQ_BOOTSTRAP_USER_ID`
（必须是 `t_user.id`）和 `HUANGJQ_BOOTSTRAP_PASSWORD`；启动迁移会以 bcrypt
哈希保存新密码，并创建带 `admin,user` 角色的账号。确认账号创建后，从部署环境移除
`HUANGJQ_BOOTSTRAP_PASSWORD`。不要把密码写入仓库、命令参数或应用日志。

需要重置已有 `huangjq` 密码时，在仓库根目录运行
`go run ./cmd/reset-huangjq-password`，通过受控密码管理器将新密码传入标准输入。
命令只输出更新结果，不输出密码；bcrypt 密码最长支持 72 字节。

服务启动成功后，使用 `huangjq` 重新登录，使新 JWT 携带账号 roles。旧 token
不会自动获得角色，访问操作日志仍返回 403。非管理员账号仍返回 HTTP 403 和
`没有权限`。
