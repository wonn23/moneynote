import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { ConfigService } from '@nestjs/config'
import { User } from 'src/user/entities/user.entity'
import { ICACHE_SERVICE } from 'src/common/utils/constants'
import { ICacheService } from 'src/cache/cache.service.interface'
import { TokenResponse } from './interfaces/token-response.interface'
import { UserRepository } from 'src/user/user.repository'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(ICACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async logIn(user: User): Promise<TokenResponse> {
    const accessToken = await this.generateAccessToken(user.id)
    const refreshToken = await this.generateRefreshToken(user.id)

    await this.setRefreshToken(user.id, refreshToken)

    return { accessToken, refreshToken }
  }

  async getAuthenticatedUser(
    email: string,
    plainTextPassword: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email })
    if (!user) {
      throw new NotFoundException('이메일을 확인해주세요.')
    }
    await this.verifyPassword(plainTextPassword, user.password)
    user.password = undefined // 비밀번호는 안보여줌
    return user
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    )
    if (!isPasswordMatching) {
      throw new BadRequestException('비밀번호를 확인해주세요.')
    }
  }

  async logOut(userId: string): Promise<void> {
    await this.cacheService.del(`refreshToken:${userId}`)
  }

  // access token 생성
  private async generateAccessToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: Number(
          this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        ),
      },
    )

    return token
  }

  // refresh token 생성
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: Number(
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ),
      },
    )

    return token
  }

  private async setRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const ttl = this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') // TTL 값 설정
    await this.cacheService.set(`refreshToken:${userId}`, refreshToken, +ttl)
  }

  private async getRefreshToken(userId: string): Promise<string | null> {
    return await this.cacheService.get<string>(`refreshToken:${userId}`)
  }

  // 클라이언트의 refresh token과 해싱된 db의 refresh token 비교
  async isRefreshTokenValid(
    refreshToken: string,
    userId: string,
  ): Promise<string | null> {
    const storedRefreshToken = await this.getRefreshToken(userId)

    if (!storedRefreshToken) {
      return null
    }
    const isMatch = storedRefreshToken === refreshToken
    return isMatch ? userId : null
  }

  async refreshAccessToken(userId: string): Promise<{ accessToken: string }> {
    const newAccessToken = await this.generateAccessToken(userId)
    return { accessToken: newAccessToken }
  }
}
