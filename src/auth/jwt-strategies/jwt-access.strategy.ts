import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Payload } from './jwt.payload'

// access token 검증 전략
@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      secretOrKey: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
    })
  }

  async validate(payload: Payload) {
    const { userId } = payload

    if (userId) {
      return userId
    } else {
      throw new UnauthorizedException('접근 오류')
    }
  }
}
