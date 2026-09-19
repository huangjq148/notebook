#!/bin/sh
set -e

# 构建前后端一体化镜像（前端静态文件 + Go 服务）
docker build -t notebook-app:latest .

# 或使用 docker compose 一键构建并启动：
# docker compose build
# docker compose up -d
