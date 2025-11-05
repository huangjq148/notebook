import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { logger } from './common/middleware/logger.middleware';

// 加载环境变量
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(logger);

  // 配置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用CORS
  app.enableCors();

  // 获取配置的端口或使用默认端口3000
  const port = process.env.PORT || 3000;

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('My API 文档') // 标题
    .setDescription('NestJS + Swagger 示例') // 描述
    .setVersion('1.0') // 版本号
    .addBearerAuth() // 支持 JWT token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // 文档访问路径

  await app.listen(port);
  console.log(`应用程序已启动，监听端口: ${port}`);
  console.log(`🚀 Swagger 文档已启动: http://localhost:${port}/api-docs`);
  console.log(
    `🚀 Swagger 文档已启动，JSON 请求地址: http://localhost:${port}/api-docs-json`,
  );
}
bootstrap();
