import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../auth.controller'
import { AuthService } from '../auth.service'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { User } from 'src/user/entities/user.entity'
import { Response } from 'express'

const mockUser = {
  id: 'testUserId',
  username: 'testUsername',
  email: 'test@test.com',
  password: 'validPassword',
  providerId: 'testProviderId',
  consultingYn: false,
  discordUrl: '',
} as User

describe('AuthController', () => {
  let authController: AuthController
  let authService: MockService<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: MockServiceFactory.getMockService(AuthService),
        },
      ],
    }).compile()

    authController = module.get<AuthController>(AuthController)
    authService = module.get(AuthService)
  })

  afterAll(async () => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(authController).toBeDefined()
  })

  describe('login', () => {
    it('이메일과 비밀번호가 일치해서 토큰을 반환합니다.', async () => {
      const mockResponse: Partial<Response> = {
        cookie: jest.fn(),
        send: jest.fn().mockImplementation((result) => {
          return result
        }),
      }

      authService.logIn.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      await authController.logIn(mockUser, mockResponse as Response)

      expect(authService.logIn).toHaveBeenCalledWith(mockUser)
      expect(mockResponse.send).toHaveBeenCalledWith({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })
  })

  describe('logout', () => {
    it('로그아웃 성공 메시지를 반환합니다.', async () => {
      const userId = mockUser.id

      authService.logOut.mockResolvedValue(undefined)
      const response = await authController.logOut(userId)

      expect(authService.logOut).toHaveBeenCalledWith(userId)
      expect(response).toEqual({ message: '로그아웃 성공.' })
    })
  })

  describe('isLoggedIn', () => {
    it('인증된 유저인지 검증합니다.', async () => {
      const userId = mockUser.id

      const result = true
      const response = await authController.isLoggedIn(userId)

      expect(response).toEqual(result)
    })
  })

  describe('refresh', () => {
    it('access Token을 재발급합니다.', async () => {
      const userId = mockUser.id

      const result = { accessToken: 'access-token' }
      authService.refreshAccessToken.mockResolvedValue(result)
      const response = await authController.refreshAccessToken(userId)

      expect(response).toEqual(result)
    })
  })
})
