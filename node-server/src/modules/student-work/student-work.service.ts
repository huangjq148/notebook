import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentWork } from './student-work.entity';

@Injectable()
export class StudentWorkService {
  constructor(
    @InjectRepository(StudentWork)
    private readonly studentWorkRepository: Repository<StudentWork>,
  ) {}

  async queryPage(): Promise<[StudentWork[], number]> {
    const result = await this.studentWorkRepository.findAndCount();

    return result;
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

  async remove(id: number): Promise<number> {
    const result = await this.studentWorkRepository.delete(id);
    return result?.affected ?? 0;
  }
}
