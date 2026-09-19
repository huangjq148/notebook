# ============================================================
# 前后端一体化镜像：一个容器同时提供前端页面和 API
#   - 前端：Vite 构建出静态文件
#   - 后端：Go 编译出静态二进制，并负责托管前端静态文件
# ============================================================

# ---------- 1. 前端构建 ----------
FROM node:22-alpine AS web_builder
WORKDIR /app/web
# 先复制依赖清单，利用缓存
COPY web/package.json web/pnpm-lock.yaml web/.npmrc ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm install -g pnpm@8 \
    && pnpm install
COPY web/ ./
RUN pnpm build

# ---------- 2. 后端构建 ----------
FROM golang:1.20 AS go_builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go env -w GOPROXY=https://mirrors.aliyun.com/goproxy,direct \
    && go mod download
COPY . .
# 静态编译，最终镜像无需 glibc
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# ---------- 3. 运行镜像 ----------
FROM alpine:latest
WORKDIR /app
# ca-certificates：SMTP/HTTPS 证书校验；tzdata：定时任务时区
RUN apk add --no-cache ca-certificates tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone
ENV TZ=Asia/Shanghai

COPY --from=go_builder /app/main .
COPY --from=web_builder /app/web/dist ./web/dist

EXPOSE 3000
CMD ["/app/main"]
