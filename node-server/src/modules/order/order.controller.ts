import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStats } from './order.entity';
import { QueryResult, ResponseResult } from 'src/utils';
import { JwtAuthGuard } from 'src/authorization/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async queryPage(
    @Query()
    query: {
      name: string;
      contact: string;
      startCreateDate: string;
      endCreateDate: string;
      current: number;
      pageSize: number;
    },
  ): Promise<QueryResult<Order>> {
    const queryResult = await this.orderService.queryPage(query);

    return ResponseResult.page<Order>(queryResult);
  }

  @Get('products')
  async products(): Promise<QueryResult<string[]>> {
    const productNames = await this.orderService.productNames();
    return ResponseResult.success<string[]>(productNames);
  }

  @Get('contacts')
  async contacts(): Promise<QueryResult<string[]>> {
    const contactNames = await this.orderService.contactNames();
    return ResponseResult.success<string[]>(contactNames);
  }

  @Get('statistics')
  async statistics(
    @Query()
    query: {
      name: string;
      contact: string;
      startCreateDate: string;
      endCreateDate: string;
      current: number;
      pageSize: number;
    },
  ): Promise<QueryResult<OrderStats>> {
    const orderStats = await this.orderService.statistics(query);

    return ResponseResult.success<OrderStats>(orderStats);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QueryResult<Order | null>> {
    const queryResult = await this.orderService.findOne(+id);
    return ResponseResult.success<Order | null>(queryResult);
  }

  @Post()
  async create(
    @Body() order: Partial<Order>,
  ): Promise<QueryResult<Order | string>> {
    let response: QueryResult<Order | string>;
    try {
      const result = await this.orderService.create(order);
      response = ResponseResult.success<Order | string>(result);
    } catch (e) {
      response = ResponseResult.error<string>(e?.message ?? '操作失败');
    }
    return response;
  }

  @Delete('revoke/stock/:id')
  async revokeStock(@Param('id') id: string): Promise<QueryResult<any>> {
    let result: QueryResult<any>;

    try {
      const message = await this.orderService.revokeStock(+id);
      result = ResponseResult.successMessage<string>(message);
    } catch (e: any) {
      result = ResponseResult.error<string>(e?.message ?? '操作失败');
    }

    return result;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() order: Partial<Order>,
  ): Promise<QueryResult<Order | null>> {
    const result = await this.orderService.update(+id, order);
    return ResponseResult.success<Order | null>(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<any>> {
    const result = ResponseResult.successMessage<string>(
      await this.orderService.remove(+id),
    );
    return result;
  }
}
