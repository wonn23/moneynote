import { Module } from '@nestjs/common'
import { AuthService } from './services/auth.service'
import { AuthController } from './controllers/auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtAccessTokenStrategy } from './strategy/jwt-access.strategy'
import { JwtRefreshTokenStrategy } from './strategy/jwt-refresh.strategy'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from 'src/user/entities/user.entity'
import { LocalStrategy } from './strategy/local.strategy'
import { UserModule } from 'src/user/user.module'
import { GoogleStrategy } from './strategy/google.strategy'

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }), // 세션 쿠키를 사용하지 않는다.
    TypeOrmModule.forFeature([User]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
  ],
})
export class AuthModule {}
