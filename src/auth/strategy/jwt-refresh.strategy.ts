import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'
import { Payload } from './jwt.payload'

// refresh token 검증 전략
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true, // validate에서 client request 접근할 수 있도록 설정
      ignoreExpiration: false,
    })
  }

  async validate(req: Request, payload: Payload) {
    try {
      const refreshToken = req.headers['authorization'].split(' ')[1]
      const isTokenValid = await this.authService.isRefreshTokenValid(
        refreshToken,
        payload.userId,
      )
      if (!isTokenValid) {
        throw new UnauthorizedException('유효한 토큰이 아닙니다.')
      }
      return isTokenValid
    } catch (error) {
      console.error('JwtRefreshTokenStrategy validate Error:', error)
      throw error
    }
  }
}
