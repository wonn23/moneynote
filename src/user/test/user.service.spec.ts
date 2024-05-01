import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { User } from '../entities/user.entity'
import { UserService } from '../user.service'
import {
  MockRepository,
  MockRepositoryFactory,
} from 'src/common/utils/mock-repository.factory'
import { getRepositoryToken } from '@nestjs/typeorm'
import { UserRepository } from '../user.repository'
import { CreateUserDto } from '../dto/create-user.dto'
import { UpdateUserDto } from '../dto/update-user.dto'

describe('UserService', () => {
  let userService: UserService
  let userRepository: MockRepository<UserRepository>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserRepository),
          useValue: MockRepositoryFactory.getMockRepository(UserRepository),
        },
      ],
    }).compile()

    userService = module.get<UserService>(UserService)
    userRepository = module.get(getRepositoryToken(UserRepository))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(userService).toBeDefined()
    expect(userRepository).toBeDefined()
  })

  describe('register', () => {
    const mockUserDto: CreateUserDto = {
      username: 'testUsername',
      email: 'test@example.com',
      password: 'validPassword',
      consultingYn: false,
    }

    it('회원가입 성공', async () => {
      userRepository.findOneBy.mockResolvedValue(null)

      const result = await userService.register(mockUserDto)

      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUserDto,
        password: expect.any(String),
      })
      expect(userRepository.findOneBy).toBeCalledWith({
        email: mockUserDto.email,
      })
      expect(result).toEqual({ message: '회원가입에 성공했습니다.' })
    })

    it('회원가입 실패: 이미 존재하는 이메일', async () => {
      const mockUser = {
        id: 'testUserId',
        username: 'testUsername',
        email: 'test@example.com',
        password: 'hashedPassword',
        consultingYn: false,
        discordUrl: '',
      }
      userRepository.findOneBy.mockResolvedValue(mockUser)

      await expect(userService.register(mockUserDto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('findByEmailOrSave', () => {
    it('존재하는 유저 반환', async () => {
      const mockUser = {
        id: 'testUserId',
        email: 'test@example.com',
        username: 'testUser',
        providerId: 'providerId123',
        consultingYn: false,
        discordUrl: '',
      }

      userRepository.findOneBy.mockResolvedValue(mockUser)

      const result = await userService.findByEmailOrSave(
        'test@example.com',
        'testUser',
        'providerId123',
      )
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
      expect(userRepository.save).not.toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('새 유저 저장 및 반환', async () => {
      const newUser = {
        id: 'testUserId',
        email: 'test@example.com',
        username: 'testUser',
        providerId: 'providerId123',
        consultingYn: false,
        discordUrl: '',
      }

      userRepository.findOneBy.mockResolvedValue(null)
      userRepository.save.mockResolvedValue(newUser)

      const result = await userService.findByEmailOrSave(
        'test@example.com',
        'testUser',
        'providerId123',
      )

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
      expect(userRepository.save).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testUser',
        providerId: 'providerId123',
      })
      expect(result).toEqual(newUser)
    })
  })

  describe('update', () => {
    it('유저 정보를 업데이트 합니다.', async () => {
      const userId = 'testUserId'
      const updateUserDto: UpdateUserDto = {
        username: 'UpdatedUser',
        password: 'validPassword',
        consultingYn: false,
      }
      const existingUser = new User()
      existingUser.id = userId
      existingUser.username = 'TestUser'

      userRepository.findOneBy.mockResolvedValue(existingUser)
      userRepository.save.mockImplementation(async (user) => user)

      await expect(
        userService.update(userId, updateUserDto),
      ).resolves.not.toThrow()

      expect(userRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        ...updateUserDto,
      })
    })

    it('해당 유저를 찾을 수 없습니다.', async () => {
      const userId = 'testUserId'
      userRepository.findOneBy.mockResolvedValue(undefined)

      await expect(userService.update(userId, {} as User)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('delete', () => {
    it('회원탈퇴 성공', async () => {
      const userId = '1'
      userRepository.delete.mockResolvedValue({ affected: 1 })

      await expect(userService.delete(userId)).resolves.not.toThrow()
    })

    it('존재하지 않는 유저를 삭제할 때', async () => {
      const userId = 'non-existing'
      userRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(userService.delete(userId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })
})
