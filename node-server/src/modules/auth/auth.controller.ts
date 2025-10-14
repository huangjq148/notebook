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
import { QueryResult, ResponseResult } from 'src/utils';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 登录
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
  ): Promise<QueryResult<string>> {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const token = this.authService.login(user);

    return ResponseResult.success<string>(token.access_token);
  }

  // 测试受保护接口
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req): any {
    debugger
    return req.user; // 会自动注入JWT中的payload
  }
}
