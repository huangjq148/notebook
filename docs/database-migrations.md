# 数据库版本化迁移说明

应用启动时自动应用 `migrations/` 中尚未执行的升级脚本，版本记录写入 `schema_migrations` 表。
`./cmd/migrate` 提供手动维护命令，并复用应用的迁移逻辑。

## 1. 目录与版本规则

```text
migrations/
  0001_create_user_account.up.sql     # 空库建 t_user_account（老库已有表则跳过）
  0001_create_user_account.down.sql
  0002_add_roles.up.sql               # 为 t_user_account 增加 roles 列
  0002_add_roles.down.sql
  0003_bootstrap_admin.up.sql         # 初始化 huangjq 管理员
  0003_bootstrap_admin.down.sql
  0004_order_batch.up.sql            # 批量订单提交回执，保证重试幂等
  0004_order_batch.down.sql
```

- 文件名格式：`<版本号>_<说明>.up.sql` / `<版本号>_<说明>.down.sql`。
- 版本号使用递增数字（脚本按数字排序）。
- 每个版本的 `up` 都可以重复执行：列已存在时不重复添加，账号已存在时不覆盖密码。
- 已执行版本记录在 `schema_migrations`（`version`、`description`、`applied_at`）。
- 迁移脚本通过 Go `embed` 编入应用和迁移工具，运行时无需读取脚本目录。

## 2. 连接配置

迁移入口复用 `internal/config.Config`，连接参数来自环境变量；本地开发也可放在项目根目录 `.env`：

```text
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
```

请勿把真实密码写入代码、脚本或 Markdown 文档。`DB_NAME` 为空、`DB_HOST`/`DB_USER` 缺失或数据库连不上时，
迁移入口会输出明确错误并以非零退出码结束，不会静默成功。

## 3. 查看版本与手动维护

```bash
# 查看当前已执行版本
go run ./cmd/migrate status

# 可选维护命令，应用也会在启动时执行同样的升级
go run ./cmd/migrate up
```

应用首次连接空库时会：

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
- 停止应用后再回滚。再次启动当前版本的应用会自动重新应用对应的升级脚本。

## 6. 应用启动行为

- 连接数据库后，应用按版本顺序执行尚未应用的 `.up.sql`，迁移成功后开始监听 HTTP。
- 同一数据库的迁移通过 MySQL 锁串行执行。迁移失败时应用记录错误并退出。
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

## 8. 批量订单事务与重试（0004）

应用启动时自动应用 `0004`，创建用于保存提交回执的 `t_order_batch`。

- `POST /api/order/batch` 接收 `{ requestId, orders }`，每批 1–500 行，适用于普通订单，不关联库存。
- 客户端为一次提交生成随机编号，并随草稿保存。同一用户的相同编号、相同内容重试，返回原订单 ID；
  相同编号对应不同内容返回 HTTP 409。不同用户的编号相互隔离。
- 提交回执与所有订单在同一 InnoDB 事务内保存。任一写入失败会回滚整批；
  提交结果因断网等原因无法确认时，应保留原编号和内容重试。
- 价格、数量最多四位小数，价格和其他费用不小于零，数量大于零；失败信息指出对应行。
- 前端每行销售金额为售价乘数量，利润为销售金额减进价乘数量、再减该行其他费用。
  展示金额按行四舍五入为两位小数，底部合计累加行金额；数据库保留原始单价和数量。
- 回执需随订单一起备份。不要单独清理回执，否则旧请求再次提交时会失去去重依据。
- 回滚 `0004` 前先停止批量写入并退回旧服务；回滚会删除回执，订单数据保留。

验证包括服务端参数校验、整批提交、第二行写入失败回滚、回执重放与内容冲突测试，
以及前端金额精度、负利润、不完整行和汇总一致性测试。
