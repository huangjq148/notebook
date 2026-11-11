# 数据库版本化迁移说明

本项目从本版本开始使用**版本化迁移**管理数据库结构变更，不再依赖应用启动时的隐式改表。
迁移脚本位于 `migrations/`，统一入口为 `./cmd/migrate`，版本记录写入 `schema_migrations` 表。

## 1. 目录与版本规则

```text
migrations/
  0001_create_user_account.up.sql     # 空库建 t_user_account（老库已有表则跳过）
  0001_create_user_account.down.sql
  0002_add_roles.up.sql               # 为 t_user_account 增加 roles 列
  0002_add_roles.down.sql
  0003_bootstrap_admin.up.sql         # 初始化 huangjq 管理员
  0003_bootstrap_admin.down.sql
```

- 文件名格式：`<版本号>_<说明>.up.sql` / `<版本号>_<说明>.down.sql`。
- 版本号使用递增数字（脚本按数字排序）。
- 每个版本的 `up` 都可以重复执行：列已存在时不重复添加，账号已存在时不覆盖密码。
- 已执行版本记录在 `schema_migrations`（`version`、`description`、`applied_at`）。
- 迁移脚本通过 Go `embed` 编入迁移二进制，运行时不依赖当前工作目录。

## 2. 连接配置

迁移入口复用 `internal/config.Config`，连接参数来自环境变量；本地开发也可放在项目根目录 `.env`：

```text
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
```

请勿把真实密码写入代码、脚本或 Markdown 文档。`DB_NAME` 为空、`DB_HOST`/`DB_USER` 缺失或数据库连不上时，
迁移入口会输出明确错误并以非零退出码结束，不会静默成功。

## 3. 执行迁移（up）

```bash
# 升级到最新版本（已是最新时仍然成功退出）
go run ./cmd/migrate up

# 查看当前已执行版本
go run ./cmd/migrate status
```

空库执行 `up` 后会：

1. 创建 `t_user_account`（`password` 为 `varchar(255)`，可容纳 bcrypt）；
2. 增加 `roles varchar(200) NOT NULL DEFAULT 'user'`；
3. 按 `ADMIN_INIT_PASSWORD` 生成 bcrypt 哈希，创建管理员 `huangjq`（`roles=admin,user`）。

> `ADMIN_INIT_PASSWORD` 只在**需要创建 huangjq** 时必填。老库已有 huangjq 时，迁移只补 `roles`，
> 不会覆盖既有密码或其它字段，因此可以不提供该变量。

## 4. huangjq 初始密码的来源与重置

- **初始密码来源**：迁移执行时从环境变量 `ADMIN_INIT_PASSWORD` 读取，使用 bcrypt 落库；
  明文不会写入迁移脚本、日志或仓库。
- **重置方式**：设置新的 `ADMIN_INIT_PASSWORD` 后执行：

```bash
ADMIN_INIT_PASSWORD='新的强密码' go run ./cmd/migrate set-password huangjq
```

该命令只更新 `huangjq` 的 `password` 字段为 bcrypt 哈希，并输出影响行数，不输出明文密码。
也可以使用其它 bcrypt 工具生成哈希后，通过受控 SQL 更新 `t_user_account.password`。

## 5. 回滚（down）

```bash
# 回滚到指定版本（目标版本保留）
go run ./cmd/migrate down 0002

# 回滚全部版本，回到空迁移状态
go run ./cmd/migrate down 0
```

回滚规则：

- `sql engine` 按版本倒序执行对应的 `down` 脚本，并从 `schema_migrations` 删除版本记录。
- `0003` 只删除**由迁移创建**的 huangjq（通过内部标记表识别），老库既有账号不会被误删；
  老库账号的 `roles` 会从 `admin,user` 回退为 `user`。
- `0002` 删除 `roles` 列。
- `0001` 只删除**由迁移在空库创建**的 `t_user_account`；迁移前已存在的业务表保持不动，避免误删存量数据。
- 回滚后再次执行 `up`，可以恢复到最新版本。

## 6. 应用启动行为

- 应用启动**不会**对已有表执行隐式 `ALTER` 补列。
- 如果数据库尚未执行迁移、缺少 `roles` 列，服务仍可启动：登录降级可用，
  但所有账号访问 `GET /api/operation-log` 一律返回 403（`AdminOnly` 不放宽）。
- 登录同时兼容 bcrypt 哈希与老库历史明文密码，避免迁移前后账号无法登录。

## 7. 本次迁移执行记录

### 7.1 本地 MySQL 8 验收环境（已执行）

- 执行时间：2026-11-11 17:24:42 CST
- 目标库：`127.0.0.1:13306/notebook`（空库重建，非登记库）
- 执行版本：`0001`、`0002`、`0003`
- 结果：`up` 成功；`schema_migrations` 记录 3 个版本；`t_user_account.roles` 默认 `user`；
  `huangjq` 的 `roles=admin,user`、密码为 bcrypt 且与 `ADMIN_INIT_PASSWORD` 匹配。
- 幂等复跑：第二次 `up` 成功且无新增版本、无重复列、密码哈希未变化。
- 回滚验证：`down 0` 清空版本记录并回退 roles 列与迁移创建的 huangjq，再次 `up` 恢复最新版本。

### 7.2 登记库（本次执行环境无法连通）

- 登记连接：`DB_HOST=192.168.5.100`、`DB_PORT=3306`、`DB_NAME=notebook`（密码仅存在于 `.env`，不入库、不入日志）。
- 实际尝试：2026-11-11 17:26 CST 执行 `go run ./cmd/migrate up`，
  返回非零退出码并输出 `dial tcp 192.168.5.100:3306: i/o timeout`；同一环境 ping 该地址 100% 丢包。
- 结论：**本次未对登记库实际执行任何迁移**（连接失败，未产生任何 DDL/DML）。
  请在能访问登记库的部署机/跳板机上执行 `go run ./cmd/migrate up`，
  并用 `go run ./cmd/migrate status` 确认 `0001/0002/0003` 均已记录。
