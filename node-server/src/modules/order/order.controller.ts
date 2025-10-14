import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStats } from './order.entity';
import { QueryResult } from 'src/utils';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(): Promise<QueryResult<Order>> {
    return this.orderService.findAll();
  }

  @Get('products')
  products(): Promise<QueryResult<string[]>> {
    return this.orderService.products();
  }

  @Get('contacts')
  sales(): Promise<QueryResult<string[]>> {
    return this.orderService.contacts();
  }

  @Get('statistics')
  statistics(): Promise<QueryResult<OrderStats>> {
    return this.orderService.statistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QueryResult<Order | null>> {
    return this.orderService.findOne(+id);
  }

  @Post()
  create(@Body() order: Partial<Order>): Promise<QueryResult<Order | string>> {
    return this.orderService.create(order);
  }

  @Delete('revoke/stock/:id')
  revokeStock(@Param('id') id: string): Promise<QueryResult<any>> {
    return this.orderService.revokeStock(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<QueryResult<Order | null>> {
    return this.orderService.update(+id, order);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<QueryResult<any>> {
    return this.orderService.remove(+id);
  }
}
