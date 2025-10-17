import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alarm } from './alarm.entity';
import axios from 'axios';

@Injectable()
export class AlarmService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
  ) {}

  async sendMessageToWeChatWebhook(id: number): Promise<string> {
    const alarm = await this.alarmRepository.findOne({ where: { id } });
    if (!alarm) {
      throw new Error('Alarm not found');
    }

    const url =
      'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=a3faa36b-f388-45a2-981d-0c9b7c611f80';
    const result = await axios.post(url, {
      msgtype: 'text',
      text: {
        content: alarm.title,
      },
    });
    console.log(result);

    if (result.status !== 200) {
      throw new Error('Failed to send message to WeChat webhook');
    }

    return 'success';
  }

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
