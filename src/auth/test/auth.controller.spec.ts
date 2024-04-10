import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../controllers/auth.controller'
import { AuthService } from '../services/auth.service'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { User } from 'src/user/entities/user.entity'

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
      const result = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      authService.logIn.mockResolvedValue(result)

      const response = await authController.logIn(mockUser)

      expect(authService.logIn).toBeCalledWith(mockUser)
      expect(response).toEqual(result)
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
