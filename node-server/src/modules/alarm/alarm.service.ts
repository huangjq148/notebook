import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm } from './alarm.entity';

@Injectable()
export class AlarmService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
  ) {}

  async queryPage(): Promise<[Alarm[], number]> {
    const queryResult = await this.alarmRepository.findAndCount();
    return queryResult;
  }

  async findOne(id: number): Promise<Alarm | null> {
    return this.alarmRepository.findOne({ where: { id } });
  }

  async create(alarm: Partial<Alarm>): Promise<Alarm> {
    const newAlarm = this.alarmRepository.create(alarm);
    return this.alarmRepository.save(newAlarm);
  }

  async update(id: number, alarm: Partial<Alarm>): Promise<Alarm | null> {
    await this.alarmRepository.update(id, alarm);
    return this.alarmRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.alarmRepository.delete(id);
  }
}
