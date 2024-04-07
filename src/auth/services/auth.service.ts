import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { User } from 'src/user/entities/user.entity'
import { SignInDto } from '../dto/signin.dto'
import { ICACHE_SERVICE } from 'src/common/utils/constants'
import { ICacheService } from 'src/cache/cache.service.interface'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(ICACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async logIn(signInDto: SignInDto): Promise<object> {
    const user = await this.validateUser(signInDto)

    const accessToken = await this.generateAccessToken(user.id)
    const refreshToken = await this.generateRefreshToken(user.id)

    await this.setRefreshToken(user.id, refreshToken)

    return { accessToken, refreshToken }
  }

  // 유저 email, 비밀번호 확인
  private async validateUser(signInDto: SignInDto): Promise<User> {
    const { email, password } = signInDto
    const user = await this.usersRepository.findOneBy({ email })

    if (!user || (await this.verifyPassword(password, user.password))) {
      throw new UnauthorizedException('이메일과 비밀번호를 확인해주세요.')
    }
    return user
  }

  async logOut(userId: string): Promise<void> {
    await this.removeRefreshToken(userId)
  }

  // async googleLogin(req) {
  //   if (!req.user) {
  //     throw new UnauthorizedException('로그인 실패')
  //   }
  //   const user = await this.usersRepository.findOneBy(req.user.username)

  //   const accessToken = await this.getJwtAccessToken(user.id)
  //   const refreshToken = await this.createJwtRefreshToken(user.id)

  //   if (!user) throw new UnprocessableEntityException('해당 유저가 없습니다.')
  //   return {
  //     message: '로그인 성공',
  //     user: req.user,
  //   }
  // }

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

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const ttl = this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME') // TTL 값 설정
    await this.cacheService.set(`refreshToken:${userId}`, refreshToken, +ttl)
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.cacheService.del(`refreshToken:${userId}`)
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    return await this.cacheService.get<string>(`refreshToken:${userId}`)
  }

  async getAuthenticatedUser(
    email: string,
    plainTextPassword: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email })
    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.')
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
      throw new BadRequestException('잘못된 인증 정보입니다.')
    }
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
