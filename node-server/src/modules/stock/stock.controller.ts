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
import { QueryResult } from 'src/utils';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  findAll(): Promise<QueryResult<Stock>> {
    return this.stockService.findAll();
  }

  @Get('statistics')
  statistics(): Promise<QueryResult<StockStatus>> {
    return this.stockService.statistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<QueryResult<Stock | null>> {
    return this.stockService.findOne(+id);
  }

  @Post()
  create(@Body() stock: Partial<Stock>): Promise<QueryResult<Stock>> {
    return this.stockService.create(stock);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() stock: Partial<Stock>,
  ): Promise<QueryResult<Stock | null>> {
    return this.stockService.update(+id, stock);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<QueryResult<string>> {
    return this.stockService.remove(+id);
  }
}
