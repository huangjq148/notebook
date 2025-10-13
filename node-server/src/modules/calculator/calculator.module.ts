import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { Calculator } from './calculator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Calculator])],
  controllers: [CalculatorController],
  providers: [CalculatorService],
})
export class CalculatorModule {}
