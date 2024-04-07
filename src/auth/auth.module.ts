import { Module } from '@nestjs/common'
import { AuthService } from './services/auth.service'
import { AuthController } from './controllers/auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtAccessTokenStrategy } from './strategy/jwt-access.strategy'
import { JwtRefreshTokenStrategy } from './strategy/jwt-refresh.strategy'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Refresh } from 'src/user/entities/refresh.entity'
import { User } from 'src/user/entities/user.entity'
import { LocalStrategy } from './strategy/local.strategy'
import { UserModule } from 'src/user/user.module'

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }), // 세션 쿠키를 사용하지 않는다.
    TypeOrmModule.forFeature([Refresh, User]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
