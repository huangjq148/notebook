import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './order.entity';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { Contact } from '../contact/contact.entity';
import { ContactModule } from '../contact/contact.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Contact]),
    ProductModule,
    ContactModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
