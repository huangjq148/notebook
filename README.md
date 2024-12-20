# Fiber with Auth

[Postman collection](https://www.getpostman.com/collections/c862d012d5dcf50326f7)

## Endpoints

- GET /api - _Say hello_
  - POST /auth/login - _Login user_
  - GET /user/:id - _Get user_
  - POST /user - _Create user_
  - PATCH /user/:id - _Update user_
  - DELETE /user/:id - _Delete user_
  - GET /product - _Get all products_
  - GET /product/:id - _Get product_
  - POST /product - _Create product_
  - DELETE /product/:id - _Delete product_

# 构建镜像

在项目根目录执行 `docker build -t web .`

# 使用 docker-compose 启动

- 构建服务 `docker-compose build`
- 启动服务 `docker-compose up -d`
- 查看容器状态 `docker-compose ps`
- 停止并删除容器 `docker-compose down`
