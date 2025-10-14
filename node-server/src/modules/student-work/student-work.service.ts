import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentWork } from './student-work.entity';
import { ResponseResult, QueryResult } from '../../utils';

@Injectable()
export class StudentWorkService {
  constructor(
    @InjectRepository(StudentWork)
    private readonly studentWorkRepository: Repository<StudentWork>,
  ) {}

  async findAll(): Promise<QueryResult<StudentWork>> {
    const result = await this.studentWorkRepository.findAndCount();
    return ResponseResult.page<StudentWork>(result);
  }

  async findOne(id: number): Promise<StudentWork | null> {
    return this.studentWorkRepository.findOne({ where: { id } });
  }

  async create(studentWork: Partial<StudentWork>): Promise<StudentWork> {
    const newStudentWork = this.studentWorkRepository.create(studentWork);
    return this.studentWorkRepository.save(newStudentWork);
  }

  async update(
    id: number,
    studentWork: Partial<StudentWork>,
  ): Promise<StudentWork | null> {
    await this.studentWorkRepository.update(id, studentWork);
    return this.studentWorkRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.studentWorkRepository.delete(id);
  }
}
