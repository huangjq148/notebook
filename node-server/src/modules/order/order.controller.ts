import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './order.entity';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order | null> {
    return this.orderService.findOne(+id);
  }

  @Post()
  create(@Body() order: Partial<Order>): Promise<Order> {
    return this.orderService.create(order);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<Order | null> {
    return this.orderService.update(+id, order);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.orderService.remove(+id);
  }
}
