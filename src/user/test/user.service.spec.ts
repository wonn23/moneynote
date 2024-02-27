import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from '../services/user.service'
import { DataSource } from 'typeorm'
import { UserRepository } from '../repositories/user.repository'
import { ForbiddenException } from '@nestjs/common'

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null), // 유저를 찾지 못한 경우를 가정
        save: jest.fn().mockResolvedValue({}),
      }),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  }),
}

const mockUserRepository = {
  findByUsername: jest.fn().mockImplementation((username) => {
    if (username === 'wonn22') {
      return Promise.resolve({
        id: 1,
        username: 'wonn22',
        password: '1q2w3e4r5t!',
        consultingYn: true,
      })
    } else {
      return Promise.resolve(null)
    }
  }),

  findById: jest.fn().mockImplementation((id) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        username: 'wonn22',
      })
    } else {
      return Promise.resolve(null)
    }
  }),
}

describe('UserService', () => {
  let service: UserService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  it('회원가입 성공', async () => {
    await expect(
      service.signUp('wonn22', '1q2w3e4r5t!', true),
    ).resolves.toStrictEqual({
      message: '회원가입에 성공했습니다',
    })
  })

  it('회원가입 실패: 이미 존재하는 유저 이름', async () => {
    mockDataSource
      .createQueryRunner()
      .manager.getRepository()
      .findOne.mockResolvedValueOnce({
        id: 1,
        username: 'wonn22',
      })

    await expect(
      service.signUp('wonn22', '1q2w3e4r5t!', true),
    ).rejects.toThrowError(ForbiddenException)
  })
})
