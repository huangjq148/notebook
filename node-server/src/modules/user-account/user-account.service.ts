import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from './user-account.entity';

@Injectable()
export class UserAccountService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,
  ) {}

  create(createUserAccount: UserAccount) {
    return this.userAccountRepository.save(createUserAccount);
  }

  findAll() {
    return this.userAccountRepository.find();
  }

  findOne(id: number) {
    return this.userAccountRepository.findOneBy({ id });
  }

  update(id: number, updateUserAccount: UserAccount) {
    return this.userAccountRepository.update(id, updateUserAccount);
  }

  remove(id: number) {
    return this.userAccountRepository.delete(id);
  }

  async findByUsername(username: string): Promise<UserAccount | null> {
    const userAccount = await this.userAccountRepository.findOneBy({
      username,
    });
    return userAccount;
  }
}
