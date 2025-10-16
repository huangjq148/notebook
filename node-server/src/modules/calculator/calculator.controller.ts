import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { Calculator } from './calculator.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Get()
  async findAll(): Promise<QueryResult<Calculator>> {
    const result = await this.calculatorService.findAll();
    return ResponseResult.page<Calculator>(result);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Calculator | null> {
    return this.calculatorService.findOne(+id);
  }

  @Post()
  create(@Body() calculator: Partial<Calculator>): Promise<Calculator> {
    return this.calculatorService.create(calculator);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() calculator: Partial<Calculator>,
  ): Promise<Calculator | null> {
    return this.calculatorService.update(+id, calculator);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.calculatorService.remove(+id);
  }
}
