// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountService } from '../user-account/user-account.service';
import { UserAccount } from '../user-account/user-account.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userAccountService: UserAccountService,
    private userService: UserService,
  ) {}

  async validateUser(username: string, pass: string) {
    const userAccount = await this.userAccountService.findByUsername(username);
    if (userAccount && userAccount.password === pass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = userAccount;

      const user = (await this.userService.findOne(userAccount.userId)) ?? {
        realname: '',
      };
      return { ...result, realname: user.realname };
    }
    throw new UnauthorizedException('用户名或密码错误');
  }

  login(user: Partial<UserAccount & User>) {
    const payload = {
      id: user.id,
      username: user.username,
      realname: user.realname,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
