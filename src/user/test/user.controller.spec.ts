import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from '../controllers/user.controller'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/create-user.dto'
import { ForbiddenException } from '@nestjs/common'

describe('UserController', () => {
  let controller: UserController

  const mockUserService = {
    signUp: jest.fn(),
  }

  const mockUserDto: CreateUserDto = {
    username: 'wonn22',
    password: '1q2w3e4r5t!',
    consultingYn: true,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  it('회원가입', async () => {
    await controller.signUp(mockUserDto)

    expect(mockUserService.signUp).toBeCalledWith(
      mockUserDto.username,
      mockUserDto.password,
      mockUserDto.consultingYn,
    )
  })

  it('회원가입: 이미 존재하는 유저 이름', async () => {
    mockUserService.signUp.mockRejectedValue(new ForbiddenException())
    await expect(controller.signUp(mockUserDto)).rejects.toThrow(
      ForbiddenException,
    )
  })
})
