import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtAccessTokenStrategy } from './strategy/jwt-access.strategy'
import { JwtRefreshTokenStrategy } from './strategy/jwt-refresh.strategy'
import { LocalStrategy } from './strategy/local.strategy'
import { UserModule } from 'src/user/user.module'
import { GoogleStrategy } from './strategy/google.strategy'
import { TypeOrmExModule } from 'src/common/decorator/typeorm-ex.module'
import { UserRepository } from 'src/user/user.repository'

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }), // 세션 쿠키를 사용하지 않는다.
    TypeOrmExModule.forCustomRepository([UserRepository]),
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
