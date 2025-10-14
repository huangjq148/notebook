import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { Alarm } from './alarm.entity';
import { QueryResult } from 'src/utils';

@Controller('alarm')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get()
  findAll(): Promise<QueryResult<Alarm>> {
    return this.alarmService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Alarm | null> {
    return this.alarmService.findOne(+id);
  }

  @Post()
  create(@Body() alarm: Partial<Alarm>): Promise<Alarm> {
    return this.alarmService.create(alarm);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() alarm: Partial<Alarm>,
  ): Promise<Alarm | null> {
    return this.alarmService.update(+id, alarm);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.alarmService.remove(+id);
  }
}
