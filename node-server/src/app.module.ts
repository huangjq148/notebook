import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AlarmModule } from './modules/alarm/alarm.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
import { StockModule } from './modules/stock/stock.module';
import { StudentWorkModule } from './modules/student-work/student-work.module';
import { UserAccountModule } from './modules/user-account/user-account.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UserModule,
    AlarmModule,
    CalculatorModule,
    OrderModule,
    StudentWorkModule,
    ProductModule,
    StockModule,
    UserAccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
