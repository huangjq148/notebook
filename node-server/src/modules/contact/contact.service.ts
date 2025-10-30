import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async queryPage(query: {
    realname: string;
    phone: string;
    address: string;
    current: number;
    pageSize: number;
  }): Promise<[Contact[], number]> {
    const queryBuilder = this.contactRepository.createQueryBuilder('contact');
    if (query.realname) {
      queryBuilder.andWhere('contact.realname LIKE :realname', {
        realname: `%${query.realname}%`,
      });
    }
    if (query.phone) {
      queryBuilder.andWhere('contact.phone LIKE :phone', {
        phone: `%${query.phone}%`,
      });
    }
    if (query.address) {
      queryBuilder.andWhere('contact.address LIKE :address', {
        address: `%${query.address}%`,
      });
    }
    queryBuilder
      .orderBy('contact.id', 'ASC')
      .skip((query.current - 1) * query.pageSize)
      .take(query.pageSize);
    const queryResult = await queryBuilder.getManyAndCount();
    return queryResult;
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

  async remove(id: number): Promise<number> {
    const result = await this.contactRepository.delete(id);
    return result?.affected ?? 0;
  }
}
