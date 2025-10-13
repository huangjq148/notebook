// auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../authorization/jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 登录
  @Post('login')
  async login(@Body() body: { realname: string; password: string }) {
    console.log(body);
    const user = await this.authService.validateUser(
      body.realname,
      body.password,
    );
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    return this.authService.login(user);
  }

  // 测试受保护接口
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // 会自动注入JWT中的payload
  }
}
