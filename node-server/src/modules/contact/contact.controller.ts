import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { Contact } from './contact.entity';
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async findAll(): Promise<QueryResult<Contact>> {
    const queryResult = await this.contactService.findAll();
    return ResponseResult.page<Contact>(queryResult);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<QueryResult<Contact | string>> {
    const result = await this.contactService.findOne(+id);
    if (!result) {
      return ResponseResult.error<Contact>('Contact not found');
    }
    return ResponseResult.success<Contact>(result);
  }

  @Post()
  async create(
    @Body() contact: Partial<Contact>,
  ): Promise<QueryResult<Contact>> {
    const result = await this.contactService.create(contact);
    return ResponseResult.success<Contact>(result);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() contact: Partial<Contact>,
  ): Promise<QueryResult<Contact | string>> {
    const result = await this.contactService.update(+id, contact);
    if (!result) {
      return ResponseResult.error<Contact>('Contact not found');
    }
    return ResponseResult.success<Contact>(result);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<QueryResult<string>> {
    const result = await this.contactService.remove(+id);
    if (result === 0) {
      return ResponseResult.error<void>('Contact not found');
    }
    return ResponseResult.successMessage<string>('success');
  }
}
