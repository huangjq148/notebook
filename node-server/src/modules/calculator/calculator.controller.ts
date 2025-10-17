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
  async findOne(
    @Param('id') id: string,
  ): Promise<QueryResult<Calculator | null>> {
    const result = await this.calculatorService.findOne(+id);
    return ResponseResult.success<Calculator | null>(result);
  }

  @Post()
  async create(
    @Body() calculator: Partial<Calculator>,
  ): Promise<QueryResult<Calculator>> {
    const result = await this.calculatorService.create(calculator);
    return ResponseResult.success<Calculator>(result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() calculator: Partial<Calculator>,
  ): Promise<QueryResult<Calculator | null>> {
    const result = await this.calculatorService.update(+id, calculator);
    return ResponseResult.success<Calculator | null>(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<string>> {
    const affected = await this.calculatorService.remove(+id);
    return affected > 0
      ? ResponseResult.successMessage('删除成功')
      : ResponseResult.error('删除失败');
  }
}
