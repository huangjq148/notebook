import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock, StockStatus } from './stock.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async queryPage(): Promise<QueryResult<Stock>> {
    const queryResult = await this.stockService.queryPage();
    return ResponseResult.page<Stock>(queryResult);
  }

  @Get('statistics')
  async statistics(): Promise<QueryResult<StockStatus>> {
    const result = await this.stockService.statistics();
    return ResponseResult.success<StockStatus>(result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<QueryResult<Stock | null>> {
    const queryResult = await this.stockService.findOne(+id);
    return ResponseResult.success<Stock | null>(queryResult);
  }

  @Post()
  async create(@Body() stock: Partial<Stock>): Promise<QueryResult<Stock>> {
    const queryResult = await this.stockService.create(stock);
    return ResponseResult.success<Stock>(queryResult);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() stock: Partial<Stock>,
  ): Promise<QueryResult<Stock | null>> {
    const queryResult = await this.stockService.update(+id, stock);
    return ResponseResult.success<Stock | null>(queryResult);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<string>> {
    const affected = await this.stockService.remove(+id);
    return affected > 0
      ? ResponseResult.successMessage('删除成功')
      : ResponseResult.error('删除失败');
  }
}
