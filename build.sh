docker build -t notebook-web .


# 构建服务端镜像
docker build -f Dockerfile.server -t notebook-server:latest .