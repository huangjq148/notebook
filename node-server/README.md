# NestJS Notebook API

这是一个使用NestJS框架和TypeORM构建的API服务器，用于Notebook应用程序。

## 技术栈

- NestJS - 一个用于构建高效、可靠和可扩展的服务器端应用程序的框架
- TypeORM - 一个ORM库，可以在TypeScript和JavaScript中运行
- MySQL - 数据库

## 功能

- 用户管理 (CRUD操作)
- 数据库集成
- 环境变量配置
- API路由前缀
- CORS支持

## 安装

```bash
# 安装依赖
npm install
```

## 配置

在项目根目录创建一个`.env`文件，并添加以下配置：

```
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=notebook

# 应用配置
PORT=3000
NODE_ENV=development
```

## 运行应用

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run start:prod
```

## API文档

启动应用后，可以通过以下路径访问API：

- 用户API: `http://localhost:3000/api/users`

### 用户API示例

- 获取所有用户: `GET /api/users`
- 获取单个用户: `GET /api/users/:id`
- 创建用户: `POST /api/users`
- 更新用户: `PUT /api/users/:id`
- 删除用户: `DELETE /api/users/:id`

## 项目结构

```
src/
├── config/             # 配置文件
├── entities/           # TypeORM实体
├── modules/            # 功能模块
│   └── users/          # 用户模块
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── app.controller.ts   # 应用控制器
├── app.module.ts       # 应用模块
├── app.service.ts      # 应用服务
└── main.ts             # 应用入口
```
