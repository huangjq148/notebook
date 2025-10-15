import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../../authorization/jwt/jwt.strategy';
import { AuthController } from './auth.controller';
import { UserAccountModule } from '../user-account/user-account.module';
import { UserAccountService } from '../user-account/user-account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from '../user-account/user-account.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount]),
    PassportModule,
    JwtModule.register({
      secret: 'SECRET_KEY', // 建议使用 .env 读取
      signOptions: { expiresIn: '24h' },
    }),
    UserAccountModule,
    UserModule,
  ],
  providers: [AuthService, JwtStrategy, UserAccountService, UserService],
  controllers: [AuthController],
})
export class AuthModule {}
