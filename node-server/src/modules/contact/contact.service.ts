import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { ResponseResult, QueryResult } from 'src/utils';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findAll(): Promise<QueryResult<Contact>> {
    const queryResult = await this.contactRepository.findAndCount();
    return ResponseResult.page<Contact>(queryResult);
  }

  async findOne(id: number): Promise<Contact | null> {
    return this.contactRepository.findOne({ where: { id } });
  }

  async create(contact: Partial<Contact>): Promise<Contact> {
    const newContact = this.contactRepository.create(contact);
    return this.contactRepository.save(newContact);
  }

  async update(id: number, contact: Partial<Contact>): Promise<Contact | null> {
    await this.contactRepository.update(id, contact);
    return this.contactRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.contactRepository.delete(id);
  }
}
