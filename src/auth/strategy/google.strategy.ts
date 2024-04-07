import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-google-oauth20'

export class JwtGoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_AUTH_CLIENT'),
      clientSecret: configService.get<string>('GOOGLE_AUTH_SERCRET'),
      callbackURL: 'http://localhost:5000/authh/login/google',
      scope: ['email', 'profile'],
    })
  }

  validate(accessToken, refreshToken, profile) {
    return {
      email: profile.emails[0].value,
      name: profile.displayName,
    }
  }
}
