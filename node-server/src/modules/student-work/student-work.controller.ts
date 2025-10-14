import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { StudentWorkService } from './student-work.service';
import { StudentWork } from './student-work.entity';
import { QueryResult } from 'src/utils';

@Controller('student-work')
export class StudentWorkController {
  constructor(private readonly studentWorkService: StudentWorkService) {}

  @Get()
  findAll(): Promise<QueryResult<StudentWork>> {
    return this.studentWorkService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<StudentWork | null> {
    return this.studentWorkService.findOne(+id);
  }

  @Post()
  create(@Body() studentWork: Partial<StudentWork>): Promise<StudentWork> {
    return this.studentWorkService.create(studentWork);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() studentWork: Partial<StudentWork>,
  ): Promise<StudentWork | null> {
    return this.studentWorkService.update(+id, studentWork);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.studentWorkService.remove(+id);
  }
}
