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
    try {
      const user: User = await this.authService.getAuthenticatedUser(
        email,
        password,
      )
      if (!user) {
        throw new UnauthorizedException('로그인 정보가 정확하지 않습니다.')
      }
      return user
    } catch (error) {
      console.error('LocalStrategy validate Error:', error)
      throw new UnauthorizedException('로그인 처리 중 문제가 발생했습니다.')
    }
  }
}
