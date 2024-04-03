import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../services/auth.service'
import { Refresh } from 'src/user/entities/refresh.entity'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { SignInDto } from '../dto/signin.dto'
import { User } from 'src/user/entities/user.entity'

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

describe('AuthService', () => {
  let service: AuthService

  const mockUserRepository = {
    findByUsername: jest.fn(),
    save: jest.fn(),
  }

  const mockRefreshRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_TOKEN_SECRET') return 'access_token_secret'
      if (key === 'JWT_REFRESH_TOKEN_SECRET') return 'refresh_token_secret'
      if (key === 'JWT_ACCESS_TOKEN_EXPIRATION_TIME') return '3600'
      if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_TIME') return '36000'
    }),
  }

  const mockJwtService = {
    sign: jest.fn(),
  }

  const signInDto: SignInDto = {
    username: 'testUser',
    password: 'testPassword',
  }

  const mockUser = {
    id: 1,
    username: 'testUser',
    password: 'hashedPassword',
    consultingYn: true,
    discordUrl: false,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: User, useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Refresh),
          useValue: mockRefreshRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should define UserService', () => {
    expect(service).toBeDefined()
  })

  describe('signIn', () => {
    it('로그인 성공', async () => {
      const bcryptCompareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))

      const accessToken = 'access_token'
      const refreshToken = 'refresh_token'

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')

      const result = await service.signIn(
        signInDto.username,
        signInDto.password,
      )

      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        signInDto.password,
        mockUser.password,
      )
      expect(result).toEqual({ accessToken, refreshToken })
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2)
    })

    it('로그인 실패: 해당 유저가 없습니다.', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null)

      await expect(service.signIn('nonexistent', 'password')).rejects.toThrow(
        '해당 유저가 없습니다.',
      )
    })

    it('로그인 실패: 비밀번호가 틀렸습니다.', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false))

      mockUserRepository.findByUsername.mockResolvedValue(mockUser)

      await expect(
        service.signIn(signInDto.username, 'wrongPassword'),
      ).rejects.toThrow('비밀번호가 틀렸습니다.')
    })
  })

  describe('getJwtAccessToken', () => {
    it('access token 생성 성공', async () => {
      const payload = { userId: '1' }
      const accessToken = 'access_token'

      mockJwtService.sign.mockReturnValue(accessToken)

      const result = await service.getJwtAccessToken(payload)

      expect(result).toBe(accessToken)
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        payload,
        expect.anything(),
      )
    })
  })
})
