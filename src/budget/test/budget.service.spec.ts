import { Test, TestingModule } from '@nestjs/testing'
import { BudgetService } from '../services/budget.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Budget } from '../entities/budget.entity'
import { Category } from '../entities/category.entity'
import { DataSource, Repository } from 'typeorm'
import { User } from 'src/user/entities/user.entity'
import { categoryEnum } from '../types/budget.enum'
import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'

const mockBudgetRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
}

const mockCategoryRepository = {
  findOne: jest.fn(),
}

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: mockBudgetRepository,
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  }),
}

describe('BudgetService', () => {
  let service: BudgetService
  let budgetRepository: Repository<Budget>
  let categoryRepository: Repository<Category>
  let dataSource: DataSource

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<BudgetService>(BudgetService)
    budgetRepository = module.get<Repository<Budget>>(
      getRepositoryToken(Budget),
    )
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    )
    dataSource = module.get(DataSource)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(budgetRepository).toBeDefined()
    expect(categoryRepository).toBeDefined()
    expect(dataSource).toBeDefined()
  })

  describe('createBudget', () => {
    it('예산 생성에 성공했습니다.', async () => {
      const createBudgetDto = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: categoryEnum.food,
      }
      const user = { id: 'user-id', username: 'testUser' } as User

      mockCategoryRepository.findOne.mockResolvedValueOnce(new Category())
      mockBudgetRepository.save.mockImplementationOnce((budget) =>
        Promise.resolve({ ...budget }),
      )

      await expect(
        service.createBudget(createBudgetDto, user),
      ).resolves.not.toThrow()
    })
  })

  describe('designBudget', () => {
    it('설정한 전체 예산과 유저들의 평균 비율을 게산하여 예산을 설계합니다.', async () => {
      const totalAmount = 2000000
      const year = 2024
      const month = 1
      jest.spyOn(service, 'getAverageCategoryRatios').mockResolvedValue([
        { name: '식사', ratio: '0.500' },
        { name: '교통', ratio: '0.075' },
        { name: '문화생활', ratio: '0.175' },
        { name: '생활용품', ratio: '0.100' },
        { name: '주거/통신', ratio: '0.150' },
      ])

      const designBudget = await service.designBudget(totalAmount, year, month)
      expect(designBudget).toEqual([
        { category: '식사', budget: 1000000 },
        { category: '문화생활', budget: 350000 },
        { category: '주거/통신', budget: 300000 },
        { category: '기타', budget: 350000 },
      ])
    })

    it('예산 설계 도출 중 InternalServerErrorException에러 발생합니다.', async () => {
      const totalAmount = 10000000
      const year = 2024
      const month = 1
      jest.spyOn(service, 'getAverageCategoryRatios').mockResolvedValue([])

      await expect(
        service.designBudget(totalAmount, year, month),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('getAverageCategoryRatios', () => {
    it('데이터를 찾았을 때 계산된 비율을 return 합니다.', async () => {
      const year = 2024
      const month = 1
      mockBudgetRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { name: '전체', averageAmount: '2000000' },
          { name: '식사', averageAmount: '1000000' },
          { name: '교통', averageAmount: '150000' },
          { name: '문화생활', averageAmount: '350000' },
          { name: '생활용품', averageAmount: '200000' },
          { name: '주거/통신', averageAmount: '300000' },
        ]),
      })

      const ratios = await service.getAverageCategoryRatios(year, month)
      expect(ratios).toEqual([
        { name: '식사', ratio: '0.500' },
        { name: '교통', ratio: '0.075' },
        { name: '문화생활', ratio: '0.175' },
        { name: '생활용품', ratio: '0.100' },
        { name: '주거/통신', ratio: '0.150' },
      ])
    })

    it('데이터를 찾지 못해 기본 비율을 return 합니다.', async () => {
      const year = 2024
      const month = 1
      mockBudgetRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { name: '식사', ratio: '0.35' },
          { name: '교통', ratio: '0.13' },
          { name: '문화생활', ratio: '0.15' },
          { name: '생활용품', ratio: '0.12' },
          { name: '주거/통신', ratio: '0.25' },
        ]),
      })

      const ratios = await service.getAverageCategoryRatios(year, month)
      expect(ratios).toEqual([
        { name: '식사', ratio: '0.35' },
        { name: '교통', ratio: '0.13' },
        { name: '문화생활', ratio: '0.15' },
        { name: '생활용품', ratio: '0.12' },
        { name: '주거/통신', ratio: '0.25' },
      ])
    })
  })

  describe('findBudgetByYear', () => {
    it('해당 연도의 예산 데이터를 성공적으로 찾습니다.', async () => {
      const year = 2024
      const category = { id: 1 }
      const user = { id: 'user-id' } as User
      mockBudgetRepository
        .createQueryBuilder()
        .where()
        .getRawMany.mockResolvedValue([
          {
            id: 1,
            year: 2024,
            month: 1,
            amount: 1000000,
            category_id: category.id,
            user_id: user.id,
          },
          {
            id: 2,
            year: 2024,
            month: 2,
            amount: 2000000,
            category_id: category.id,
            user_id: user.id,
          },
        ])

      const result = await service.findBudgetByYear(year, user)
      expect(result).toHaveLength(2)
      expect(result[0].year).toEqual(year)
      expect(result[1].year).toEqual(year)
    })

    it('해당 연도의 예산 데이터가 없을 경우 NotFoundException을 발생시킵니다.', async () => {
      const year = 2024
      const user = { id: 'user-id' } as User

      mockBudgetRepository
        .createQueryBuilder()
        .where()
        .getRawMany.mockResolvedValue([])

      await expect(service.findBudgetByYear(year, user)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('findBudgetByYearAndMonth', () => {
    it('해당 연도와 월의 예산 데이터를 성공적으로 찾습니다.', async () => {
      const year = 2024
      const month = 1
      const category = { id: 1 }
      const user = { id: 'user-id' } as User

      mockBudgetRepository
        .createQueryBuilder()
        .where()
        .getRawMany.mockResolvedValue([
          {
            id: 1,
            year: 2024,
            month: 1,
            amount: 1000000,
            category_id: category.id,
            user_id: user.id,
          },
          {
            id: 2,
            year: 2024,
            month: 1,
            amount: 3000000,
            category_id: category.id,
            user_id: user.id,
          },
        ])

      const result = await service.findBudgetByYearAndMonth(year, month, user)
      expect(result).toHaveLength(2)
      expect(result[0].month).toEqual(month)
      expect(result[1].month).toEqual(month)
    })

    it('해당 연도의 월의 예산 데이터가 없을 경우 NotFoundException을 발생시킵니다.', async () => {
      const year = 2024
      const month = 1
      const user = { id: 'user-id' } as User

      mockBudgetRepository
        .createQueryBuilder()
        .where()
        .getRawMany.mockResolvedValue([])

      await expect(
        service.findBudgetByYearAndMonth(year, month, user),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateBudget', () => {
    it('예산을 성공적으로 수정합니다.', async () => {
      const id = 1
      const updatedBudgetDto: UpdateBudgetDto = {
        amount: 200000,
        category: categoryEnum.food,
      }
      const user = { id: 'user-id' } as User

      mockDataSource
        .createQueryRunner()
        .manager.findOne.mockResolvedValueOnce(new Category())
        .mockResolvedValueOnce(new Budget())

      mockDataSource.createQueryRunner().manager.save.mockResolvedValue({
        ...updatedBudgetDto,
        id,
        user,
      })

      const result = await service.updateBudget(id, updatedBudgetDto, user)
      expect(result.amount).toEqual(updatedBudgetDto.amount)
    })

    it('예산을 수정하는데 실패했습니다.', async () => {
      const id = 1
      const updateBudgetDto = {
        amount: 200000,
        category: '없는 카테고리' as any,
      }
      const user = { id: 'user-id' } as User

      mockDataSource
        .createQueryRunner()
        .manager.findOne.mockResolvedValueOnce(null)

      await expect(
        service.updateBudget(id, updateBudgetDto, user),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('deleteBudget', () => {
    it('예산을 성공적으로 삭제합니다.', async () => {
      const id = 1

      mockBudgetRepository.delete.mockResolvedValue({ affected: 1 })

      await expect(service.deleteBudget(id)).resolves.not.toThrow()
      expect(mockBudgetRepository.delete).toHaveBeenCalledWith(id)
    })

    it('해당 id의 예산을 찾을 수 없을 경우 NotFOundException을 발생시킵니다.', async () => {
      const id = 99

      mockBudgetRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(service.deleteBudget(id)).rejects.toThrow(NotFoundException)
      expect(mockBudgetRepository.delete).toHaveBeenCalledWith(id)
    })
  })
})
