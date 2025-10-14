import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountService } from './user-account.service';
import { UserAccountController } from './user-account.controller';
import { UserAccount } from './user-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccount])],
  controllers: [UserAccountController],
  providers: [UserAccountService],
})
export class UserAccountModule {}
