import { TypeOrmModuleOptions } from '@nestjs/typeorm';
// import { join } from 'path';

// 根据环境选择不同的数据库配置
// const isDevelopment = process.env.NODE_ENV !== 'production';

export const databaseConfig: TypeOrmModuleOptions = {
  // 生产环境使用MySQL
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'fright2014',
  database: process.env.DB_DATABASE || 'notebook',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // 生产环境不自动同步数据库结构
  logging: false,
};
// export const databaseConfig: TypeOrmModuleOptions = isDevelopment
//   ? {
//       // 开发环境使用SQLite
//       type: 'sqlite',
//       database: join(process.cwd(), 'data', 'dev.sqlite'),
//       entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//       synchronize: true,
//       logging: true,
//     }
//   : {
//       // 生产环境使用MySQL
//       type: 'mysql',
//       host: process.env.DB_HOST || 'localhost',
//       port: parseInt(process.env.DB_PORT || '3306'),
//       username: process.env.DB_USERNAME || 'root',
//       password: process.env.DB_PASSWORD || 'password',
//       database: process.env.DB_DATABASE || 'notebook',
//       entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//       synchronize: false, // 生产环境不自动同步数据库结构
//       logging: false,
//     };
