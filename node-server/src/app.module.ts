import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

import { AlarmModule } from './modules/alarm/alarm.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { OrderModule } from './modules/order/order.module';
import { StudentWorkModule } from './modules/student-work/student-work.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    AlarmModule,
    CalculatorModule,
    OrderModule,
    StudentWorkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
