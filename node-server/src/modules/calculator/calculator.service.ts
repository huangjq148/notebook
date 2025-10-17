import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculator } from './calculator.entity';

@Injectable()
export class CalculatorService {
  constructor(
    @InjectRepository(Calculator)
    private readonly calculatorRepository: Repository<Calculator>,
  ) {}

  async findAll(): Promise<[Calculator[], number]> {
    const result = await this.calculatorRepository.findAndCount();
    return result;
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

  async remove(id: number): Promise<number> {
    const result = await this.calculatorRepository.delete(id);
    return result.affected || 0;
  }
}
