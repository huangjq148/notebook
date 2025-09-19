import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置全局路由前缀
  app.setGlobalPrefix('api');

  // 启用CORS
  app.enableCors();

  // 获取配置的端口或使用默认端口3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`应用程序已启动，监听端口: ${port}`);
}
bootstrap();
