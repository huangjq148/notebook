import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { Contact } from '../contact/contact.entity';
import { ContactModule } from '../contact/contact.module';
import { Stock } from '../stock/stock.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Contact, Stock]),
    ProductModule,
    ContactModule,
    StockModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
