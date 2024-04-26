import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../services/auth.service'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from 'src/user/entities/user.entity'
import {
  MockRepository,
  MockRepositoryFactory,
} from 'src/common/utils/mock-repository.factory'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { ICacheService } from 'src/cache/cache.service.interface'
import { ICACHE_SERVICE } from 'src/common/utils/constants'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { CacheService } from 'src/cache/cache.service'
import { UserRepository } from 'src/user/user.repository'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: MockRepository<UserRepository>
  let jwtService: MockService<JwtService>
  let configService: MockService<ConfigService>
  let cacheService: MockService<ICacheService>

  const mockUser = {
    id: 'testUserId',
    username: 'testUsername',
    email: 'test@example.com',
    password: 'hashedPassword',
    providerId: 'testProviderId',
    consultingYn: false,
    discordUrl: '',
  } as User

  const userId = mockUser.id
  const mockRefreshToken = 'mockRefreshToken'
  const newAccessToken = 'newAccessToken'

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserRepository),
          useValue: MockRepositoryFactory.getMockRepository(UserRepository),
        },
        {
          provide: ConfigService,
          useValue: MockServiceFactory.getMockService(ConfigService),
        },
        {
          provide: JwtService,
          useValue: MockServiceFactory.getMockService(JwtService),
        },
        {
          provide: ICACHE_SERVICE,
          useValue: MockServiceFactory.getMockService(CacheService),
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    userRepository = module.get(getRepositoryToken(UserRepository))
    cacheService = module.get(ICACHE_SERVICE)
    jwtService = module.get(JwtService)
    configService = module.get(ConfigService)

    jwtService.sign.mockImplementation((payload, options) => {
      if (options.secret === 'access-secret') {
        return 'access-token'
      } else if (options.secret === 'refresh-secret') {
        return 'refresh-token'
      }
    })

    configService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'JWT_ACCESS_TOKEN_SECRET':
          return 'access-secret'
        case 'JWT_ACCESS_TOKEN_EXPIRATION_TIME':
          return '3600'
        case 'JWT_REFRESH_TOKEN_SECRET':
          return 'refresh-secret'
        case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
          return '7200'
        default:
          return null
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should define UserService', () => {
    expect(authService).toBeDefined()
  })

  describe('logIn', () => {
    it('로그인 성공 시, 액세스 토큰과 리프레시 토큰 반환', async () => {
      const result = await authService.logIn(mockUser)

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      expect(jwtService.sign).toHaveBeenCalledTimes(2)
      expect(cacheService.set).toHaveBeenCalledWith(
        `refreshToken:${mockUser.id}`,
        'refresh-token',
        expect.any(Number),
      )
    })
  })

  describe('getAuthenticatedUser', () => {
    it('유저가 존재하고 비밀번호가 일치하면 유저 객체 반환', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser)
      const bcryptCompareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))

      const result = await authService.getAuthenticatedUser(
        mockUser.email,
        'validPassword',
      )

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        'validPassword',
        'hashedPassword',
      )
      expect(result).toEqual({ ...mockUser, password: undefined })
    })

    it('사용자가 없을 경우 NotFoundException 발생', async () => {
      userRepository.findOneBy.mockResolvedValue(undefined)

      await expect(
        authService.getAuthenticatedUser('nonexistent@example.com', 'password'),
      ).rejects.toThrow(NotFoundException)
    })

    it('잘못된 비밀번호로 인증 시 BadRequestException 발생', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser)
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false))

      await expect(
        authService.getAuthenticatedUser(mockUser.email, 'wrongPassword'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('logOut', () => {
    it('로그아웃 시, 리프레시 토큰이 캐시에서 삭제되어야 함', async () => {
      await authService.logOut(userId)

      expect(cacheService.del).toHaveBeenCalledWith(`refreshToken:${userId}`)
    })
  })

  describe('isRefreshTokenValid', () => {
    it('토큰이 일치하면 사용자 ID 반환', async () => {
      cacheService.get.mockResolvedValue(mockRefreshToken)
      const result = await authService.isRefreshTokenValid(
        mockRefreshToken,
        userId,
      )

      expect(result).toEqual(userId)
      expect(cacheService.get).toHaveBeenCalledWith(`refreshToken:${userId}`)
    })

    it('저장된 토큰이 없으면 null 반환', async () => {
      cacheService.get.mockResolvedValue(null)

      const result = await authService.isRefreshTokenValid(
        mockRefreshToken,
        userId,
      )
      expect(result).toBeNull()
    })

    it('토큰이 일치하지 않으면 null 반환', async () => {
      cacheService.get.mockResolvedValue('differentToken')
      const result = await authService.isRefreshTokenValid(
        mockRefreshToken,
        userId,
      )
      expect(result).toBeNull()
    })
  })

  describe('refreshAccessToken', () => {
    it('새 액세스 토큰 반환', async () => {
      jwtService.sign.mockReturnValue(newAccessToken)

      const result = await authService.refreshAccessToken(userId)
      expect(result).toEqual({ accessToken: newAccessToken })
      expect(jwtService.sign).toHaveBeenCalledTimes(1)
    })
  })
})
