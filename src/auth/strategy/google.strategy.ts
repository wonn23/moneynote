import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20'
import { User } from 'src/user/entities/user.entity'
import { UserService } from 'src/user/services/user.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    console.log('accessToken', accessToken)
    console.log('refreshToken', refreshToken)
    const { id, name, emails } = profile

    const providerId = id
    const email = emails[0].value

    const user: User = await this.userService.findByEmailOrSave(
      email,
      name.familyName + name.givenName,
      providerId,
    )
    done(null, user)
  }
}
