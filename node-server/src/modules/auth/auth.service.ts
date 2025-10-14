// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAccountService } from '../user-account/user-account.service';
import { UserAccount } from '../user-account/user-account.entity';
// import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userAccountService: UserAccountService,
  ) {}

  async validateUser(username: string, pass: string) {
    const userAccount = await this.userAccountService.findByUsername(username);
    if (userAccount && userAccount.password === pass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = userAccount;
      return result;
    }
    throw new UnauthorizedException('用户名或密码错误');
  }

  login(user: Partial<UserAccount>) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
