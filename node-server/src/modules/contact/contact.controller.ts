import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { Contact } from './contact.entity';
import { QueryResult } from 'src/utils';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  findAll(): Promise<QueryResult<Contact>> {
    return this.contactService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Contact | null> {
    return this.contactService.findOne(+id);
  }

  @Post()
  create(@Body() contact: Partial<Contact>): Promise<Contact> {
    return this.contactService.create(contact);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() contact: Partial<Contact>,
  ): Promise<Contact | null> {
    return this.contactService.update(+id, contact);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.contactService.remove(+id);
  }
}
