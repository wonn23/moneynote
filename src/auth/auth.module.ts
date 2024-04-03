import { Module } from '@nestjs/common'
import { AuthService } from './services/auth.service'
import { AuthController } from './controllers/auth.controller'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtAccessTokenStrategy } from './jwt-strategies/jwt-access.strategy'
import { JwtRefreshTokenStrategy } from './jwt-strategies/jwt-refresh.strategy'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Refresh } from 'src/user/entities/refresh.entity'
import { User } from 'src/user/entities/user.entity'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Refresh, User]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessTokenStrategy, JwtRefreshTokenStrategy],
})
export class AuthModule {}
