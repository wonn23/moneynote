import { Test, TestingModule } from '@nestjs/testing'
import { ExpenseService } from '../services/expense.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Expense } from '../entities/expense.entity'
import { Category } from 'src/budget/entities/category.entity'
import { Repository } from 'typeorm'
import { Budget } from 'src/budget/entities/budget.entity'
import { UserRepository } from 'src/user/repositories/user.repository'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { categoryEnum } from 'src/budget/types/budget.enum'
import { NotFoundException } from '@nestjs/common'
import { User } from 'src/user/entities/user.entity'
import { UpdateBudgetDto } from 'src/budget/dto/update-budget.dto'

const mockUserRepository = {
  findOne: jest.fn(),
}
const mockBudgetRepository = {
  createQueryBuilder: jest.fn(),
}
const mockExpenseRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
}

const mockCategoryRepository = {
  findOne: jest.fn(),
}

describe('ExpenseService', () => {
  let service: ExpenseService
  let userRepository: UserRepository
  let budgetRepository: Repository<Budget>
  let expenseRepository: Repository<Expense>
  let categoryRepository: Repository<Category>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: mockExpenseRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile()

    service = module.get<ExpenseService>(ExpenseService)
    userRepository = module.get<UserRepository>(UserRepository)
    budgetRepository = module.get<Repository<Budget>>(
      getRepositoryToken(Budget),
    )
    expenseRepository = module.get<Repository<Expense>>(
      getRepositoryToken(Expense),
    )
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(userRepository).toBeDefined()
    expect(budgetRepository).toBeDefined()
    expect(expenseRepository).toBeDefined()
    expect(categoryRepository).toBeDefined()
  })

  describe('createExpense', () => {
    it('지출 생성에 성공했습니다.', async () => {
      const userId = 'userId'
      const createExpenseDto: CreateExpenseDto = {
        amount: 5000,
        memo: 'Test expense',
        isExcluded: false,
        category: categoryEnum.food,
      }
      const spentDate = new Date()
      // 필요한 객체를 찾을 수 있도록 모의설정 하였음
      mockUserRepository.findOne.mockResolvedValue({ id: userId })
      mockCategoryRepository.findOne.mockResolvedValue({
        name: createExpenseDto.category,
      })

      const expectedExpense = new Expense()
      Object.assign(expectedExpense, createExpenseDto, { user: { id: userId } })

      jest.spyOn(expenseRepository, 'create').mockReturnValue(expectedExpense)
      jest.spyOn(expenseRepository, 'save').mockResolvedValue(expectedExpense)

      const result = await service.createExpense(createExpenseDto, userId)

      expect(result).toEqual(expectedExpense)
      expect(expenseRepository.create).toHaveBeenCalledWith({
        ...createExpenseDto,
        spentDate,
        category: { name: createExpenseDto.category },
        user: { id: userId },
      })
      expect(expenseRepository.save).toHaveBeenCalledWith(expectedExpense)
    })

    it('유저를 찾지 못해서 NotFoundException 에러가 발생했습니다.', async () => {
      const createExpenseDto: CreateExpenseDto = {
        amount: 10000,
        memo: 'Test expense',
        isExcluded: false,
        category: categoryEnum.food,
      }
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(
        service.createExpense(createExpenseDto, 'userId'),
      ).rejects.toThrow(NotFoundException)
    })

    it('해당 카테고리를 찾지 못해서 NotFoundException 에러가 발생했습니다.', async () => {
      const createExpenseDto: CreateExpenseDto = {
        amount: 10000,
        memo: 'Test expense',
        isExcluded: false,
        category: categoryEnum.food,
      }
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce({ id: 'userId' } as User)
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValueOnce(null)

      await expect(
        service.createExpense(createExpenseDto, 'userId'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getAllExpense', () => {
    it('모든 지출 조회에 성공했습니다.', async () => {
      const userId = 'user-id'
      const mockExpenses = [
        {
          id: 1,
          amount: 5000,
          memo: null,
          spentDate: '2024-02-29T15:00:00.000Z',
          isExcluded: false,
          createdAt: '2024-03-03T17:21:09.992Z',
          updatedAt: '2024-03-03T17:21:09.992Z',
          deletedAt: null,
        },
        {
          id: 2,
          amount: 10000,
          memo: null,
          spentDate: '2024-02-29T15:00:00.000Z',
          isExcluded: false,
          createdAt: '2024-03-03T17:21:09.992Z',
          updatedAt: '2024-03-03T17:21:09.992Z',
          deletedAt: null,
        },
      ]

      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockExpenses),
      })

      const result = await service.getAllExpense(userId)

      expect(result).toEqual(mockExpenses)
      expect(mockExpenseRepository.createQueryBuilder).toHaveBeenCalled()
    })
  })

  describe('getOneExpense', () => {
    it('지출 상세 조회에 성공했습니다.', async () => {
      const expenseId = 1
      const userId = 'userId'
      const expectedExpense = {
        amount: 5000,
        memo: '점심 식사',
        spentDate: '2024-03-01T15:00:00.000Z',
        isExcluded: false,
        categoryId: 2,
      }

      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(expectedExpense),
      })

      const result = await service.getOneExpense(expenseId, userId)

      expect(result).toEqual(expectedExpense)
      expect(mockExpenseRepository.createQueryBuilder).toHaveBeenCalled()
    })
  })

  describe('updateExpense', () => {
    it('지출 수정에 성공했습니다.', async () => {
      const expenseId = 1
      const updateExpenseDto: UpdateBudgetDto = {
        amount: 3000,
        memo: '저녁 식사',
        isExcluded: false,
        category: categoryEnum.food,
      }
      const userId = 'userId'
      const mockExpense = {
        id: 2,
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

      mockUserRepository.findOne.mockResolvedValue({ id: userId })
      mockCategoryRepository.findOne.mockResolvedValue({
        name: updateExpenseDto.category,
      })
      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockExpense),
      })

      Object.assign(mockExpense, updateExpenseDto)

      mockExpenseRepository.save.mockResolvedValue(mockExpense)

      const result = await service.updateExpense(
        expenseId,
        updateExpenseDto,
        userId,
      )

      expect(result).toEqual(mockExpense)
      expect(expenseRepository.save).toHaveBeenCalledWith(mockExpense)
    })
  })

  describe('deleteExpense', () => {
    it('지출 삭제에 성공했습니다.', async () => {
      const expenseId = 1
      const userId = 'userId'

      mockExpenseRepository.delete.mockResolvedValue({ affected: 1 })

      await service.deleteExpense(expenseId, userId)

      expect(mockExpenseRepository.delete).toHaveBeenCalledWith({
        id: expenseId,
        user: { id: userId },
      })
    })

    it('삭제하려는 지출을 찾을 수 없을 때 NotFoundException을 발생시킵니다.', async () => {
      jest
        .spyOn(mockExpenseRepository, 'delete')
        .mockResolvedValue({ affected: 0 }) // 삭제된 레코드가 없음

      const expenseId = 999 // 존재하지 않는 ID
      const userId = 'user-id'

      await expect(service.deleteExpense(expenseId, userId)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('recommendExpense', () => {
    it('오늘의 지출 추천 계산에 성공했습니다.', async () => {
      const userId = 'userId'
      const categoryId = 1
      const today = new Date()
      const budgetAmount = 30000
      const spentAmount = 15000
      const remainingDays =
        new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() -
        today.getDate()
      const mockBudget = {
        categoryId,
        amount: budgetAmount,
      }
      const mockExpense = {
        amount: spentAmount,
      }

      mockBudgetRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockExpense),
      })

      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockExpense),
      })

      const result = await service.recommendExpense(userId)

      expect(result).toEqual(
        expect.objectContaining({
          totalDailyBudget: expect.any(Number),
          todayRecommendedExpenseByCategoryExcludingTotal: expect.any(Array),
          message: expect.any(String),
        }),
      )
    })
  })

  describe('guideExpense', () => {
    it('오늘의 지출 안내 계산에 성공했습니다.', async () => {
      const userId = 'userId'
      jest.spyOn(service, 'recommendExpense').mockResolvedValue({
        totalDailyBudget: 5000,
        todayRecommendedExpenseByCategoryExcludingTotal: [
          { categoryId: 1, todaysRecommendedExpenditureAmount: 2000 },
          { categoryId: 2, todaysRecommendedExpenditureAmount: 3000 },
        ],
        message: '합리적으로 소비하고 있네요 좋습니다.',
      })

      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest
          .fn()
          .mockResolvedValueOnce({ amount: 1500 })
          .mockResolvedValue({ amount: 2500 }),
      })

      const expected = [
        { categoryId: 1, todaysSpentAmount: 1500, degreeOfDanger: '75' },
        { categoryId: 2, todaysSpentAmount: 2500, degreeOfDanger: '83' },
      ]

      const result = await service.guideExpense(userId)

      expect(result).toEqual(expected)
    })
  })

  describe('compareRatioToLastMonth', () => {
    it('저번달과 이번달의 소비율 비교에 성공했습니다.', async () => {
      const userId = 'userId'
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

      mockExpenseRepository.createQueryBuilder.mockImplementation(
        () => mockQueryBuilder,
      )
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockLastMonthExpenditures)
        .mockResolvedValueOnce(mockThisMonthExpenditures)

      const expectedResults = [
        {
          categoryId: 2,
          lastMonthAmount: 2000,
          thisMonthAmount: 1000,
          ratio: '200.00%',
        },
        {
          categoryId: 3,
          lastMonthAmount: 3000,
          thisMonthAmount: 1000,
          ratio: '300.00%',
        },
      ]

      const results = await service.compareRatioToLastMonth(userId)
      expect(results).toEqual(expectedResults)
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'expense.spent_date >= :lastMonthStartDate',
        expect.any(Object),
      )
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'expense.spent_date < :lastMonthEndDate',
        expect.any(Object),
      )
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'expense.user_id = :userId',
        { userId },
      )
    })
  })

  describe('compareRatioToLastWeek', () => {
    it('저번주과 이번주의 소비율 비교에 성공했습니다.', async () => {
      const userId = 'userId'

      const mockLastWeekExpenditures = [
        { categoryId: 2, amount: 1000 },
        { categoryId: 3, amount: 2000 },
      ]
      const mockThisWeekExpenditures = [
        { categoryId: 2, amount: 2000 },
        { categoryId: 3, amount: 500 },
      ]

      mockExpenseRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      })

      mockExpenseRepository
        .createQueryBuilder()
        .getRawMany.mockResolvedValueOnce(mockLastWeekExpenditures)
        .mockResolvedValue(mockThisWeekExpenditures)

      const results = await service.compareRatioToLastWeek(userId)

      expect(results).toEqual([
        {
          categoryId: 2,
          lastWeekAmount: 1000,
          thisWeekAmount: 2000,
          ratio: '50.00%',
        },
        {
          categoryId: 3,
          lastWeekAmount: 2000,
          thisWeekAmount: 500,
          ratio: '400.00%',
        },
      ])
    })
  })
})
