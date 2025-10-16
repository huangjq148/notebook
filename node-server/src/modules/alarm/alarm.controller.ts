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
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('alarm')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get()
  async findAll(): Promise<QueryResult<Alarm>> {
    const queryResult = await this.alarmService.queryPage();

    return ResponseResult.page<Alarm>(queryResult);
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
