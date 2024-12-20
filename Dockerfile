FROM node:16 AS node_build
WORKDIR /app
COPY ./web/package.json ./
RUN npm install -g pnpm@8
RUN pnpm install
COPY ./web/. .
RUN pnpm build
FROM nginx:alpine
COPY --from=node_build /app/dist /usr/share/nginx/html
# 将自定义的Nginx配置文件复制到容器中
COPY ./deploy/config/nginx.conf /etc/nginx/conf.d/default.conf
# 暴露80端口
EXPOSE 80
# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]


