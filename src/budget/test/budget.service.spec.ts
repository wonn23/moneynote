import { Test, TestingModule } from '@nestjs/testing'
import { BudgetService } from '../budget.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Budget } from '../entities/budget.entity'
import { Category } from '../entities/category.entity'
import { User } from 'src/user/entities/user.entity'
import { categoryEnum } from '../types/budget.enum'
import { NotFoundException } from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import {
  MockRepository,
  MockRepositoryFactory,
} from 'src/common/utils/mock-repository.factory'
import { BudgetRepository } from '../budget.repository'
import { CategoryRepository } from '../category.repository'
import { IBudgetDesignStrategy } from '../interfaces/budget-design.interface'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { IBUDGET_DESIGN_STRAGTEGY } from 'src/common/utils/constants'
import { DefaultBudgetDesignStrategy } from '../default-budget-design-strategy'
import { CreateBudgetDto } from '../dto/create-budget.dto'

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}))

const mockUser = {
  id: 'testUserId',
  username: 'testUsername',
  email: 'test@example.com',
  password: 'hashedPassword',
  providerId: 'testProviderId',
  consultingYn: false,
  discordUrl: '',
} as User

describe('BudgetService', () => {
  let budgetService: BudgetService
  let budgetRepository: MockRepository<BudgetRepository>
  let categoryRepository: MockRepository<CategoryRepository>
  let budgetDesignStrategy: MockService<IBudgetDesignStrategy>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getRepositoryToken(BudgetRepository),
          useValue: MockRepositoryFactory.getMockRepository(BudgetRepository),
        },
        {
          provide: getRepositoryToken(CategoryRepository),
          useValue: MockRepositoryFactory.getMockRepository(CategoryRepository),
        },
        {
          provide: IBUDGET_DESIGN_STRAGTEGY,
          useValue: MockServiceFactory.getMockService(
            DefaultBudgetDesignStrategy,
          ),
        },
      ],
    }).compile()

    budgetService = module.get<BudgetService>(BudgetService)
    budgetRepository = module.get(getRepositoryToken(BudgetRepository))
    categoryRepository = module.get(getRepositoryToken(CategoryRepository))
    budgetDesignStrategy = module.get(IBUDGET_DESIGN_STRAGTEGY)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(budgetService).toBeDefined()
    expect(budgetRepository).toBeDefined()
    expect(categoryRepository).toBeDefined()
    expect(budgetDesignStrategy).toBeDefined()
  })

  describe('createBudget', () => {
    it('예산 생성에 성공했습니다.', async () => {
      const userId = mockUser.id
      const createBudgetDto: CreateBudgetDto = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: categoryEnum.food,
      }
      const category: Category = {
        id: 2,
        name: '식사',
      } as Category
      const expectedBudget: Budget = {
        ...createBudgetDto,
        category,
        user: { id: userId },
        id: expect.any(Number),
      } as Budget

      categoryRepository.findOneBy.mockResolvedValue(category)
      budgetRepository.create.mockResolvedValue(expectedBudget)
      budgetRepository.save.mockResolvedValue(expectedBudget)

      const result = await budgetService.createBudget(createBudgetDto, userId)

      expect(budgetRepository.create).toHaveBeenCalledWith({
        ...createBudgetDto,
        category,
        user: { id: userId },
      })
      expect(budgetRepository.save).toHaveBeenCalled()
      expect(result).toEqual(expectedBudget)
    })
  })

  describe('designBudget', () => {
    it('설정한 전체 예산과 유저들의 평균 비율을 게산하여 예산을 설계합니다.', async () => {})

    it('예산 설계 도출 중 InternalServerErrorException에러 발생합니다.', async () => {})
  })

  describe('findBudgets', () => {
    const userId = mockUser.id
    const year = 2024
    const month = 4

    function setupMocks(budgetDetails) {
      const mockBudgets = [
        {
          id: 1,
          year: budgetDetails.year,
          month: budgetDetails.month,
          amount: 100,
          category: { id: 2, name: categoryEnum.food },
          user: mockUser,
        },
      ]
      budgetRepository.find.mockResolvedValue(mockBudgets)
      return mockBudgets
    }
    it('해당 연도의 예산 데이터를 성공적으로 찾습니다.', async () => {
      const mockBudgets = setupMocks({ year })

      const result = await budgetService.findBudgets(userId, year)

      expect(budgetRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, year },
        relations: ['category', 'user'],
      })
      expect(result).toEqual(mockBudgets)
    })

    it('해당 연도와 월별 예산 데이터를 성공적으로 찾습니다.', async () => {
      const mockBudgets = setupMocks({ year, month })

      const result = await budgetService.findBudgets(userId, year, month)

      expect(budgetRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id }, year, month },
        relations: ['category', 'user'],
      })
      expect(result).toEqual(mockBudgets)
    })

    it('해당 연도 혹은 월의 예산 데이터가 없을 경우 NotFoundException을 발생시킵니다.', async () => {
      budgetRepository.find.mockResolvedValue([])

      await expect(budgetService.findBudgets(userId, year)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updateBudget', () => {
    const userId = mockUser.id
    const category: Category = {
      id: 2,
      name: categoryEnum.food,
    } as Category
    const budget: Budget = {
      id: 1,
      year: 2024,
      month: 4,
      amount: 100,
      category: { id: 2, name: categoryEnum.food },
    } as Budget
    const updateBudgetDto: UpdateBudgetDto = {
      amount: 200,
      category: categoryEnum.curtureLife,
    }
    const updatedBudget: Budget = {
      id: 1,
      year: 2024,
      month: 4,
      amount: 200,
      category: { id: 4, name: categoryEnum.food },
      user: { id: mockUser.id },
    } as Budget

    it('예산을 성공적으로 수정합니다.', async () => {
      categoryRepository.findOneBy.mockResolvedValue(category)
      budgetRepository.findOne.mockResolvedValue(budget)
      budgetRepository.save.mockResolvedValue(updatedBudget)

      const result = await budgetService.updateBudget(
        1,
        updateBudgetDto,
        userId,
      )
      expect(result).toEqual(updatedBudget)
      expect(budgetRepository.save).toHaveBeenCalledWith({
        ...budget,
        ...updateBudgetDto,
        category,
        user: { id: mockUser.id },
      })
    })

    it('해당 카테고리를 탖을 수 없습니다.', async () => {
      categoryRepository.findOneBy.mockResolvedValue(null)
      await expect(
        budgetService.updateBudget(1, updateBudgetDto, userId),
      ).rejects.toThrow(NotFoundException)
    })

    it('해당 예산을 찾을 수 없습니다.', async () => {
      categoryRepository.findOneBy.mockResolvedValue(category)
      budgetRepository.findOne.mockResolvedValue(null)
      await expect(
        budgetService.updateBudget(1, updateBudgetDto, userId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteBudget', () => {
    it('예산을 성공적으로 삭제합니다.', async () => {
      const budgetId = 1

      budgetRepository.delete.mockResolvedValue({ affected: 1 })

      await expect(budgetService.deleteBudget(budgetId)).resolves.not.toThrow()
      expect(budgetRepository.delete).toHaveBeenCalledWith(budgetId)
    })

    it('해당 id의 예산을 찾을 수 없을 경우 NotFOundException을 발생시킵니다.', async () => {
      const budgetId = 99

      budgetRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(budgetService.deleteBudget(budgetId)).rejects.toThrow(
        NotFoundException,
      )
      expect(budgetRepository.delete).toHaveBeenCalledWith(budgetId)
    })
  })
})
