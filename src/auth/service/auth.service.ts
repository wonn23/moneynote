import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { SignInDto } from '../dto/signin.dto'
import { UserRepository } from '../../user/repository/user.repository'
import * as bcrypt from 'bcrypt'
import { ConfigService } from '@nestjs/config'
import { Refresh } from 'src/user/entities/refresh.entity'
import { Repository } from 'typeorm'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private usersRepository: UserRepository,
    @InjectRepository(Refresh)
    private refreshRepository: Repository<Refresh>, //custom repository 생성 불필요하다고 판단
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<object> {
    try {
      const { username, password } = signInDto

      const user = await this.usersRepository.findByUsername(username)

      if (!user) throw new UnprocessableEntityException('해당 유저가 없습니다.')

      const isAuth = await bcrypt.compare(password, user.password)

      if (!isAuth) throw new UnauthorizedException('비밀번호가 틀렸습니다.')

      const payload = { userId: user.id }
      const accessToken = await this.getJwtAccessToken(payload)
      const refreshToken = await this.getJwtRefreshToken(payload)

      const salt = await bcrypt.genSalt()
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt) // db 유출 문제를 대비해 refresh token을 hash하여 저장

      const rToken = new Refresh()
      rToken.id = user.id
      rToken.token = hashedRefreshToken

      this.refreshRepository.save(rToken)

      return { accessToken, refreshToken }
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        console.log('Unprocessable Entity Exception:', error.message)
      } else if (error instanceof UnauthorizedException) {
        console.log('Unauthorized Exception:', error.message)
      } else throw new InternalServerErrorException(error)
    }
  }

  // access token 생성
  async getJwtAccessToken(payload: object): Promise<string> {
    const token = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: Number(
        this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
      ),
    })

    return token
  }

  // refresh token 생성
  async getJwtRefreshToken(payload: object) {
    const token = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: Number(
        this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
      ),
    })

    return token
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
