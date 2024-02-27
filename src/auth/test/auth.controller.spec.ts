import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../controllers/auth.controller'
import { AuthService } from '../services/auth.service'
import { SignInDto } from '../dto/signin.dto'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    signIn: jest.fn(),
    getNewAccessToken: jest.fn(),
  }

  const mockSignInDto: SignInDto = {
    username: 'wonn22',
    password: '1q2w3e4r5t!',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('로그인: AuthService의 signIn을 호출', async () => {
    const result = {
      accessToken: 'access-oken',
      refreshToken: 'refresh-token',
    }
    mockAuthService.signIn.mockResolvedValue(result)

    const response = await controller.signIn(mockSignInDto)

    expect(authService.signIn).toBeCalledWith(
      mockSignInDto.username,
      mockSignInDto.password,
    )
    expect(response).toEqual(result)
  })

  it('Refresh Token으로 새로운 액세스 토큰 발급받음', async () => {
    const mockReq = {
      user: {
        id: 'user-id',
      },
    }
    const accessToken = 'new-ascces-token'
    mockAuthService.getNewAccessToken.mockResolvedValue({ accessToken })

    const response = await controller.getNewAccessToken(mockReq)

    expect(authService.getNewAccessToken).toHaveBeenCalledWith(mockReq.user)
    expect(response).toEqual({ accessToken })
  })
})
