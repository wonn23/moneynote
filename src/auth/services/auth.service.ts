import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { Refresh } from 'src/user/entities/refresh.entity'
import { Repository } from 'typeorm'
import { User } from 'src/user/entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Refresh)
    private refreshRepository: Repository<Refresh>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string): Promise<object> {
    try {
      const user = await this.usersRepository.findOneBy({ username })

      if (!user) throw new UnprocessableEntityException('해당 유저가 없습니다.')

      const isAuth = await bcrypt.compare(password, user.password)

      if (!isAuth) throw new UnauthorizedException('비밀번호가 틀렸습니다.')

      const payload = { userId: user.id }

      const accessToken = await this.getJwtAccessToken(payload)
      const refreshToken = await this.getJwtRefreshToken(payload)

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10) // db 유출 문제를 대비해 refresh token을 hash하여 저장

      const existingRefreshToken = await this.refreshRepository.findOneBy({
        id: user.id,
      })

      if (existingRefreshToken) {
        // 기존 리프레시 토큰이 있으면 업데이트
        existingRefreshToken.token = hashedRefreshToken
        await this.refreshRepository.save(existingRefreshToken)
      } else {
        // 새 리프레시 토큰 생성 및 저장
        const refreshTokenEntity = new Refresh()
        refreshTokenEntity.id = user.id
        refreshTokenEntity.token = hashedRefreshToken
        await this.refreshRepository.save(refreshTokenEntity)

        user.refresh = refreshTokenEntity
        await this.usersRepository.save(user)
      }

      return { accessToken, refreshToken }
    } catch (error) {
      if (
        error instanceof UnprocessableEntityException ||
        error instanceof UnauthorizedException
      ) {
        throw error
      }
      console.error('로그인 과정에서 에러 발생:', error)
      throw new InternalServerErrorException(
        '로그인 처리 중 에러가 발생했습니다.',
      )
    }
  }

  // access token 생성
  async getJwtAccessToken(payload: object): Promise<string> {
    try {
      const token = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: Number(
          this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        ),
      })
      return token
    } catch (error) {
      console.error('JWT 토큰 생성 중 에러 발생.', error)
      throw new InternalServerErrorException('토큰 생성 실패')
    }
  }

  // refresh token 생성
  async getJwtRefreshToken(payload: object) {
    try {
      const token = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: Number(
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        ),
      })

      return token
    } catch (error) {
      console.error('JWT 토큰 생성 중 에러 발생.', error)
      throw new InternalServerErrorException('토큰 생성 실패')
    }
  }

  // 클라이언트의 refresh token과 해싱된 db의 refresh token 비교
  async getUserIfRefreshTokenMatches(refreshToken: string, id: string) {
    const userToken = await this.refreshRepository.findOneBy({ id })

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      userToken.token,
    )

    if (isRefreshTokenMatching) return userToken.id
  }

  // 만료된 access token 재발급
  async getNewAccessToken(id: string) {
    const payload = { userId: id }
    const accessToken = await this.getJwtAccessToken(payload)

    return { accessToken }
  }
}
