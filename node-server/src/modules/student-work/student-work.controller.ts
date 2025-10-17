import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { StudentWorkService } from './student-work.service';
import { StudentWork } from './student-work.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('student-work')
export class StudentWorkController {
  constructor(private readonly studentWorkService: StudentWorkService) {}

  @Get()
  async queryPage(): Promise<QueryResult<StudentWork>> {
    const result = await this.studentWorkService.queryPage();
    return ResponseResult.page<StudentWork>(result);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<QueryResult<StudentWork | null>> {
    const result = await this.studentWorkService.findOne(+id);
    return ResponseResult.success<StudentWork | null>(result);
  }

  @Post()
  async create(
    @Body() studentWork: Partial<StudentWork>,
  ): Promise<QueryResult<StudentWork>> {
    const result = await this.studentWorkService.create(studentWork);
    return ResponseResult.success<StudentWork>(result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() studentWork: Partial<StudentWork>,
  ): Promise<QueryResult<StudentWork | null>> {
    const result = await this.studentWorkService.update(+id, studentWork);
    return ResponseResult.success<StudentWork | null>(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<string>> {
    const affected = await this.studentWorkService.remove(+id);
    if (affected > 0) {
      return ResponseResult.successMessage<string>('删除成功');
    }
    return ResponseResult.error<string>('删除失败');
  }
}
