# FROM node:16 AS node_build
# WORKDIR /app
# COPY ./web/package.json ./
# RUN npm install -g pnpm@8
# RUN pnpm install
# COPY ./web/. .
# RUN pnpm build
# FROM nginx:alpine
# COPY --from=node_build /app/dist /usr/share/nginx/html
# # 将自定义的Nginx配置文件复制到容器中
# COPY ./deploy/config/nginx.conf /etc/nginx/conf.d/default.conf
# # 暴露80端口
# EXPOSE 80
# # 启动Nginx
# CMD ["nginx", "-g", "daemon off;"]


# FROM golang:1.20 AS go_build
# WORKDIR /app
# COPY go.mod go.sum ./
# RUN go mod download
# COPY . .
# RUN go build -o /my-go-app
# # 第二阶段：运行阶段
# FROM alpine:latest
# COPY --from=go_build /my-go-app /my-go-app
# # ENTRYPOINT ["./main"]
# EXPOSE 3000
# CMD [ "/my-go-app" ]


# 第一阶段：构建阶段
# 使用Go官方镜像作为构建环境
FROM golang:1.20 as go_builder

# 设置工作目录
WORKDIR /app

# 复制go.mod和go.sum文件以预下载依赖项
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用程序
RUN go build -o /main main.go

# 第二阶段：运行阶段
# 使用一个轻量级的基础镜像
FROM alpine:latest

# 从构建阶段复制可执行文件
COPY --from=go_builder main /bin/main

EXPOSE 3000

# 定义启动命令
CMD ["/bin/main"]