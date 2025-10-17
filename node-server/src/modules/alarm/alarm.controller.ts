import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { Alarm } from './alarm.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('alarm')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Get('sendMessageToWeChatWebhook')
  async sendMessageToWeChatWebhook(
    @Query('id') id: string,
  ): Promise<QueryResult<string>> {
    const result = await this.alarmService.sendMessageToWeChatWebhook(+id);

    return ResponseResult.successMessage<string>(result);
  }

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
  async create(@Body() alarm: Partial<Alarm>): Promise<QueryResult<Alarm>> {
    const result = await this.alarmService.create(alarm);
    return ResponseResult.success<Alarm>(result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() alarm: Partial<Alarm>,
  ): Promise<QueryResult<Alarm | string>> {
    const result = await this.alarmService.update(+id, alarm);
    if (!result) {
      return ResponseResult.error<Alarm>('Alarm not found');
    }
    return ResponseResult.success<Alarm>(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<void>> {
    await this.alarmService.remove(+id);
    return ResponseResult.successMessage<void>('success');
  }
}
