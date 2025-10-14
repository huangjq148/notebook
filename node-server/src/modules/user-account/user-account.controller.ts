import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { UserAccount } from './user-account.entity';

@Controller('user-account')
export class UserAccountController {
  constructor(private readonly userAccountService: UserAccountService) {}

  @Post()
  create(@Body() createUserAccountDto: UserAccount) {
    return this.userAccountService.create(createUserAccountDto);
  }

  @Get()
  findAll() {
    return this.userAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userAccountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserAccount: UserAccount) {
    return this.userAccountService.update(+id, updateUserAccount);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userAccountService.remove(+id);
  }
}
