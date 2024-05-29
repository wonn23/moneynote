import { Test, TestingModule } from '@nestjs/testing'
import { ExpenseService } from '../expense.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { categoryEnum } from 'src/budget/types/budget.enum'
import { NotFoundException } from '@nestjs/common'
import { User } from 'src/user/entities/user.entity'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import {
  MockRepository,
  MockRepositoryFactory,
} from 'src/common/utils/mock-repository.factory'
import { UserRepository } from 'src/user/user.repository'
import { BudgetRepository } from 'src/budget/budget.repository'
import { CategoryRepository } from 'src/budget/category.repository'
import { ExpenseRepository } from '../expense.repository'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { IExpenseMessageService } from '../interfaces/expense.message.service.interface'
import { IExpenseCalculationService } from '../interfaces/expense.calculation.service.interface'
import { IBudgetService } from 'src/budget/interfaces/budget.service.interface'
import {
  IBUDGET_SERVICE,
  IEXPENSE_CALCULATION_SERVICE,
  IEXPENSE_MESSAGE_SERVICE,
} from 'src/common/utils/constants'
import { ExpenseCalculationService } from '../expense.calculation.service'
import { BudgetService } from 'src/budget/budget.service'
import { ExpenseMessageService } from '../expense.message.service'
import { Category } from 'src/budget/entities/category.entity'
import { Expense } from '../entities/expense.entity'

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

const mockCategory = {
  id: 2,
  name: '식사',
}

describe('ExpenseService', () => {
  let expenseService: ExpenseService
  let userRepository: MockRepository<UserRepository>
  let expenseRepository: MockRepository<ExpenseRepository>
  let categoryRepository: MockRepository<CategoryRepository>
  let expenseCalculationService: MockService<IExpenseCalculationService>
  let expenseMesaageService: MockService<IExpenseMessageService>
  let budgetService: MockService<IBudgetService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: getRepositoryToken(UserRepository),
          useValue: MockRepositoryFactory.getMockRepository(UserRepository),
        },
        {
          provide: getRepositoryToken(BudgetRepository),
          useValue: MockRepositoryFactory.getMockRepository(BudgetRepository),
        },
        {
          provide: getRepositoryToken(ExpenseRepository),
          useValue: MockRepositoryFactory.getMockRepository(ExpenseRepository),
        },
        {
          provide: getRepositoryToken(CategoryRepository),
          useValue: MockRepositoryFactory.getMockRepository(CategoryRepository),
        },
        {
          provide: IEXPENSE_CALCULATION_SERVICE,
          useValue: MockServiceFactory.getMockService(
            ExpenseCalculationService,
          ),
        },
        {
          provide: IEXPENSE_MESSAGE_SERVICE,
          useValue: MockServiceFactory.getMockService(ExpenseMessageService),
        },
        {
          provide: IBUDGET_SERVICE,
          useValue: MockServiceFactory.getMockService(BudgetService),
        },
      ],
    }).compile()

    expenseService = module.get<ExpenseService>(ExpenseService)
    userRepository = module.get(getRepositoryToken(UserRepository))
    expenseRepository = module.get(getRepositoryToken(ExpenseRepository))
    categoryRepository = module.get(getRepositoryToken(CategoryRepository))
    expenseCalculationService = module.get(IEXPENSE_CALCULATION_SERVICE)
    expenseMesaageService = module.get(IEXPENSE_MESSAGE_SERVICE)
    budgetService = module.get(IBUDGET_SERVICE)
  })

  afterAll(async () => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(expenseService).toBeDefined()
    expect(userRepository).toBeDefined()
    expect(expenseRepository).toBeDefined()
    expect(categoryRepository).toBeDefined()
  })

  describe('createExpense', () => {
    const createExpenseDto: CreateExpenseDto = {
      amount: 5000,
      memo: '점심 식사',
      isExcluded: false,
      category: categoryEnum.food,
    }

    it('지출 생성에 성공했습니다.', async () => {
      const userId = mockUser.id

      const category: Category = {
        id: 2,
        name: '식사',
      } as Category

      const expectedExpense: Expense = {
        ...createExpenseDto,
        category,
        user: { id: userId },
        id: expect.any(Number),
      } as Expense

      userRepository.findOneBy.mockResolvedValue(mockUser)
      categoryRepository.findOneBy.mockResolvedValue(category)
      expenseRepository.create.mockResolvedValue(expectedExpense)
      expenseRepository.save.mockResolvedValue(expectedExpense)

      const result = await expenseService.createExpense(
        createExpenseDto,
        userId,
      )

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId })
      expect(categoryRepository.findOneBy).toHaveBeenCalledWith({
        name: createExpenseDto.category,
      })
      expect(expenseRepository.create).toHaveBeenCalledWith({
        ...createExpenseDto,
        category,
        spentDate: expect.any(Date),
        user: { id: userId },
      })
      expect(expenseRepository.save).toHaveBeenCalled()
      expect(result).toEqual(expectedExpense)
    })

    it('유저를 찾지 못해서 NotFoundException 에러가 발생했습니다.', async () => {
      userRepository.findOneBy.mockResolvedValueOnce(null)

      await expect(
        expenseService.createExpense(createExpenseDto, userId),
      ).rejects.toThrow(NotFoundException)
    })

    it('해당 카테고리를 찾지 못해서 NotFoundException 에러가 발생했습니다.', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser)
      categoryRepository.findOneBy.mockResolvedValue(null)

      await expect(
        expenseService.createExpense(createExpenseDto, userId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getAllExpense', () => {
    it('모든 지출 조회에 성공했습니다.', async () => {
      const mockExpenses = [new Expense(), new Expense()]
      const startDate = new Date()
      const endDate = new Date()

      expenseRepository.find.mockResolvedValue(mockExpenses)

      const result = await expenseService.getAllExpense(
        userId,
        startDate,
        endDate,
      )

      expect(expenseRepository.find).toHaveBeenCalled()
      expect(result).toEqual(mockExpenses)
    })
  })

  describe('getOneExpense', () => {
    it('지출 상세 조회에 성공했습니다.', async () => {
      const expenseId = 1
      const expectedExpense = {
        amount: 5000,
        memo: '점심 식사',
        spentDate: '2024-03-01T15:00:00.000Z',
        isExcluded: false,
        categoryId: 2,
      }
      expenseRepository.findOne.mockResolvedValue(expectedExpense)

      const result = await expenseService.getOneExpense(expenseId, userId)

      expect(expenseRepository.findOne).toHaveBeenCalled()
      expect(result).toEqual(expectedExpense)
    })

    it('지출 ID가 존재하지 않아 NotFoundException 에러가 발생했습니다.', async () => {
      const expenseId = 9999
      expenseRepository.findOne.mockResolvedValue(null)

      await expect(
        expenseService.getOneExpense(expenseId, userId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateExpense', () => {
    const updateExpenseDto: UpdateExpenseDto = {
      amount: 12000,
      memo: '영화',
      isExcluded: false,
      category: categoryEnum.curtureLife,
    }
    it('지출 수정에 성공했습니다.', async () => {
      const expenseId = 1

      const mockExpense = {
        id: 1,
        amount: 5000,
        memo: '점심 식사',
        spentDate: '2024-03-01T15:00:00.000Z',
        isExcluded: false,
        createdAt: '2024-03-03T17:21:09.992Z',
        updatedAt: '2024-03-06T11:20:10.545Z',
        deletedAt: null,
        category: {
          id: 2,
          name: '식사',
        },
      }

      const updatedExpense = {
        id: 1,
        amount: 5000,
        memo: '저녁 식사',
        spentDate: '2024-03-01T15:00:00.000Z',
        isExcluded: false,
        createdAt: '2024-03-03T17:21:09.992Z',
        updatedAt: '2024-03-06T11:20:10.545Z',
        deletedAt: null,
        category: {
          id: 4,
          name: '문화생활',
        },
      }

      userRepository.findOneBy.mockResolvedValue(mockUser)
      categoryRepository.findOneBy.mockResolvedValue(mockCategory)
      expenseRepository.findOne.mockResolvedValue(mockExpense)
      expenseRepository.save.mockResolvedValue(updatedExpense)

      const result = await expenseService.updateExpense(
        expenseId,
        updateExpenseDto,
        userId,
      )

      expect(expenseRepository.save).toHaveBeenCalled()
      expect(result).toEqual(updatedExpense)
    })

    it('수정하려는 지출이 존재하지 않아 NotFoundException 에러가 발생했습니다.', async () => {
      const expenseId = 9999
      expenseRepository.findOne.mockResolvedValue(null)

      await expect(
        expenseService.updateExpense(expenseId, updateExpenseDto, userId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteExpense', () => {
    it('지출 삭제에 성공했습니다.', async () => {
      const expenseId = 1

      expenseRepository.delete.mockResolvedValue({ affected: 1 })

      await expenseService.deleteExpense(expenseId, userId)

      expect(expenseRepository.delete).toHaveBeenCalledWith({
        id: expenseId,
        user: { id: userId },
      })
    })

    it('삭제하려는 지출을 찾을 수 없을 때 NotFoundException을 발생시킵니다.', async () => {
      const expenseId = 999

      expenseRepository.delete.mockResolvedValue({ affected: 0 })

      await expect(
        expenseService.deleteExpense(expenseId, userId),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('recommendExpense', () => {
    it('오늘의 지출 추천 계산에 성공했습니다.', async () => {
      const mockBudgets = [
        {
          categoryId: 1,
          amount: 10000,
        },
      ]

      const mockExpenses = [
        {
          id: 1,
          amount: 10000,
          memo: '점심식사',
          spentDate: new Date(),
          isExcluded: false,
        },
      ]

      const mockResults = [
        {
          categoryId: 1,
          categoryName: '전체',
          todaysRecommendedExpenseAmount: 150,
        },
        {
          categoryId: 2,
          categoryName: '식사',
          todaysRecommendedExpenseAmount: 100,
        },
        {
          categoryId: 3,
          categoryName: '교통',
          todaysRecommendedExpenseAmount: 50,
        },
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      }

      userRepository.findOneBy.mockResolvedValue(mockUser)
      budgetService.findBudgets.mockResolvedValue(mockBudgets)
      expenseRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder,
      )
      mockQueryBuilder.getRawMany.mockResolvedValue(mockExpenses)
      expenseCalculationService.calculateRecommendedExpenses.mockReturnValue(
        mockResults,
      )
      expenseMesaageService.getRecommendationMessage.mockReturnValue(
        '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!',
      )

      const result = await expenseService.recommendExpense(userId)

      expect(budgetService.findBudgets).toHaveBeenCalledWith(
        userId,
        expect.any(Number),
        expect.any(Number),
      )
      expect(
        expenseCalculationService.calculateRecommendedExpenses,
      ).toHaveBeenCalledWith(mockBudgets, mockExpenses, expect.any(Date), 1000)
      expect(result).toEqual({
        availableDailyExpense: expect.any(Number),
        filteredTodayRecommendedExpenseByCategory: expect.any(Array),
        message: expect.any(String),
      })
      expect(result.filteredTodayRecommendedExpenseByCategory).toContainEqual(
        expect.objectContaining({
          categoryId: expect.any(Number),
          categoryName: expect.any(String),
          todaysRecommendedExpenseAmount: expect.any(Number),
        }),
      )
    })
  })

  describe('guideExpense', () => {
    it('오늘의 지출 안내 계산에 성공했습니다.', async () => {
      const mockRecommendedExpense = {
        availableDailyExpense: 86263,
        filteredTodayRecommendedExpenseByCategory: [
          {
            categoryId: 2,
            categoryName: '식사',
            todaysRecommendedExpenseAmount: 36000,
          },
          {
            categoryId: 3,
            categoryName: '교통',
            todaysRecommendedExpenseAmount: 4421,
          },
          {
            categoryId: 4,
            categoryName: '문화생활',
            todaysRecommendedExpenseAmount: 36000,
          },
          {
            categoryId: 5,
            categoryName: '주거/통신',
            todaysRecommendedExpenseAmount: 4421,
          },
          {
            categoryId: 6,
            categoryName: '생활용품',
            todaysRecommendedExpenseAmount: 4421,
          },
          {
            categoryId: 7,
            categoryName: '기타',
            todaysRecommendedExpenseAmount: 0,
          },
        ],
        message: '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!',
      }

      jest
        .spyOn(expenseService, 'recommendExpense')
        .mockResolvedValue(mockRecommendedExpense)

      expenseRepository.createQueryBuilder.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { categoryId: 2, totalAmount: '16000' },
          { categoryId: 3, totalAmount: '3000' },
          { categoryId: 4, totalAmount: '50000' },
          { categoryId: 5, totalAmount: '30000' },
          { categoryId: 6, totalAmount: '3000' },
        ]),
      }))

      const expected = [
        {
          categoryName: '식사',
          ratio: '44.44%',
        },
        {
          categoryName: '교통',
          ratio: '67.86%',
        },
        {
          categoryName: '문화생활',
          ratio: '138.89%',
        },
        {
          categoryName: '주거/통신',
          ratio: '678.58%',
        },
        {
          categoryName: '생활용품',
          ratio: '67.86%',
        },
      ]

      expenseCalculationService.calculateExpenseRatios.mockReturnValue(expected)

      const result = await expenseService.guideExpense(userId)

      expect(result).toEqual(expected)
    })
  })

  describe('compareRatioToLastMonth', () => {
    it('저번달과 이번달의 소비율 비교에 성공했습니다.', async () => {
      const mockLastMonthExpenditures = [
        { categoryId: 2, amount: 2000 },
        { categoryId: 3, amount: 3000 },
      ]
      const mockThisMonthExpenditures = [
        { categoryId: 2, amount: 1000 },
        { categoryId: 3, amount: 1000 },
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      }

      expenseRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder,
      )
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockThisMonthExpenditures)
        .mockResolvedValueOnce(mockLastMonthExpenditures)

      const expectedResult = [
        {
          categoryId: 2,
          lastMonthAmount: 2000,
          thisMonthAmount: 1000,
          ratio: '50.00%',
        },
        {
          categoryId: 3,
          lastMonthAmount: 3000,
          thisMonthAmount: 1000,
          ratio: '33.33%',
        },
      ]

      const result = await expenseService.compareRatioToLastMonth(userId)

      expect(result).toEqual(expectedResult)
    })
  })

  describe('compareRatioToLastWeek', () => {
    it('저번주과 이번주의 소비율 비교에 성공했습니다.', async () => {
      const mockLastWeekExpenditures = [
        { categoryId: 2, amount: 1000 },
        { categoryId: 3, amount: 2000 },
      ]
      const mockThisWeekExpenditures = [
        { categoryId: 2, amount: 2000 },
        { categoryId: 3, amount: 500 },
      ]

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      }

      expenseRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder,
      )
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockLastWeekExpenditures)
        .mockResolvedValueOnce(mockThisWeekExpenditures)

      const expectedResult = [
        {
          categoryId: 2,
          lastWeekAmount: 1000,
          thisWeekAmount: 2000,
          ratio: '200.00%',
        },
        {
          categoryId: 3,
          lastWeekAmount: 2000,
          thisWeekAmount: 500,
          ratio: '25.00%',
        },
      ]

      const result = await expenseService.compareRatioToLastWeek(userId)

      expect(result).toEqual(expectedResult)
    })
  })
})
