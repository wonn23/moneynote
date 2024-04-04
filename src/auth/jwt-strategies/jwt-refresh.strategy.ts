import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../services/auth.service'
import { Payload } from './jwt.payload'

// refresh token 검증 전략
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true, // validate에서 client request 접근할 수 있도록 설정
    })
  }

  async validate(req: Request, payload: Payload) {
    const accessToken = req.headers['authorization'].split(' ')[1] // client request의 헤더에서 토큰값 가져오기('Bearer ' 제거)

    // db에 저장되어있는 해당 유저의 refresh token 값과 비교
    return this.authService.getUserIfRefreshTokenMatches(
      accessToken,
      payload.userId,
    )
  }
}
