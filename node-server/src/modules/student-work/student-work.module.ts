import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentWorkController } from './student-work.controller';
import { StudentWorkService } from './student-work.service';
import { StudentWork } from './student-work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentWork])],
  controllers: [StudentWorkController],
  providers: [StudentWorkService],
})
export class StudentWorkModule {}
