import { Test, TestingModule } from '@nestjs/testing'
import { UserController } from '../user.controller'
import { UserService } from '../user.service'
import { CreateUserDto } from '../dto/create-user.dto'
import { ForbiddenException } from '@nestjs/common'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { UpdateUserDto } from '../dto/update-user.dto'

describe('UserController', () => {
  let userController: UserController
  let userService: MockService<UserService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: MockServiceFactory.getMockService(UserService),
        },
      ],
    }).compile()

    userController = module.get<UserController>(UserController)
    userService = module.get(UserService)
  })

  it('should be defined', () => {
    expect(userController).toBeDefined()
  })

  describe('register', () => {
    const mockUserDto: CreateUserDto = {
      username: 'testUsername',
      email: 'test@example.com',
      password: 'validPassword',
      consultingYn: false,
    }

    it('register', async () => {
      const message = { message: '회원가입에 성공했습니다.' }
      userService.register.mockResolvedValue(message)

      const result = await userController.register(mockUserDto)

      expect(userService.register).toHaveBeenCalledWith(mockUserDto)
      expect(result).toEqual(message)
    })

    it('회원가입: 이미 존재하는 유저 이름', async () => {
      userService.register.mockRejectedValue(new ForbiddenException())

      await expect(userController.register(mockUserDto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('update', () => {
    it('should update user info', async () => {
      const userId = 'testUserId'
      const updateUserDto: UpdateUserDto = {
        username: 'newUsername',
        password: 'newPassword',
        consultingYn: true,
      }
      userService.update.mockResolvedValue(undefined)

      await expect(
        userController.update(userId, updateUserDto),
      ).resolves.not.toThrow()

      expect(userService.update).toHaveBeenCalledWith(userId, updateUserDto)
    })
  })

  describe('delete', () => {
    it('should delete a user', async () => {
      const userId = 'testUserId'
      userService.delete.mockResolvedValue(undefined)

      await expect(userController.delete(userId)).resolves.not.toThrow()

      expect(userService.delete).toHaveBeenCalledWith(userId)
    })
  })
})
