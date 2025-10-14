import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';
import { ResponseResult, QueryResult } from 'src/utils';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(Calculator)
    private readonly calculatorRepository: Repository<Calculator>,
  ) {}

  async findAll(): Promise<QueryResult<Calculator>> {
    const result = await this.calculatorRepository.findAndCount();
    return ResponseResult.page<Calculator>(result);
  }

  async findOne(id: number): Promise<Calculator | null> {
    return this.calculatorRepository.findOne({ where: { id } });
  }

  async create(calculator: Partial<Calculator>): Promise<Calculator> {
    const newCalculator = this.calculatorRepository.create(calculator);
    return this.calculatorRepository.save(newCalculator);
  }

  async update(
    id: number,
    calculator: Partial<Calculator>,
  ): Promise<Calculator | null> {
    await this.calculatorRepository.update(id, calculator);
    return this.calculatorRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.calculatorRepository.delete(id);
  }
}
