import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { User } from 'src/user/entities/user.entity'
import { AuthService } from '../services/auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    })
  }

  async validate(
    email: string,
    password: string,
  ): Promise<User | UnauthorizedException> {
    const user: User = await this.authService.getAuthenticatedUser(
      email,
      password,
    )

    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
