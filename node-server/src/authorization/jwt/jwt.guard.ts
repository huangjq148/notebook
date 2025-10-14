// auth/jwt.guard.ts
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🟦 JwtAuthGuard 正在执行');
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    if (err || !user) {
      console.error('❌ JWT 验证失败:', err || info?.message);
      throw err || new UnauthorizedException('Token 无效或过期');
    }
    console.log('✅ 验证通过, user =', user);
    return user;
  }
}
