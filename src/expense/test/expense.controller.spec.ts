import { Test, TestingModule } from '@nestjs/testing'
import { ExpenseController } from '../controllers/expense.controller'
import { ExpenseService } from '../services/expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { categoryEnum } from 'src/budget/types/budget.enum'
import { Expense } from '../entities/expense.entity'
import { InternalServerErrorException } from '@nestjs/common'
import { UpdateExpenseDto } from '../dto/update-expense.dto'

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}))

const mockExpense = {
  id: 1,
  amount: 10000,
  memo: '점심식사',
  isExcluded: false,
  cateogory: {
    id: 1,
    name: categoryEnum.food,
  },
  user: { id: 'userId' },
  createdAt: new Date(),
  updatedAt: new Date(),
}

const createExpenseDto: CreateExpenseDto = {
  amount: 10000,
  memo: '저녁 식사',
  isExcluded: false,
  category: categoryEnum.food,
}

describe('ExpenseController', () => {
  let controller: ExpenseController
  let service: ExpenseService

  beforeEach(async () => {
    const mockExpenseService = {
      createExpense: jest.fn().mockResolvedValue(mockExpense),
      getAllExpense: jest.fn(),
      getOneExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
      recommendExpense: jest.fn(),
      guideExpense: jest.fn(),
      compareRatioToLastMonth: jest.fn(),
      compareRatioToLastWeek: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [
        {
          provide: ExpenseService,
          useValue: mockExpenseService,
        },
      ],
    }).compile()

    controller = module.get<ExpenseController>(ExpenseController)
    service = module.get<ExpenseService>(ExpenseService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('지출 생성에 성공했습니다.', async () => {
      const userId = 'userId'

      const createExpenseSpy = jest.spyOn(service, 'createExpense')

      const result = await controller.create(createExpenseDto, userId)

      expect(createExpenseSpy).toHaveBeenCalledWith(createExpenseDto, userId)
      expect(result).toEqual(mockExpense)
    })

    it('지출 생성에 실패했습니다.', async () => {
      const userId = 'userId'
      jest
        .spyOn(service, 'createExpense')
        .mockRejectedValue(new InternalServerErrorException())

      await expect(controller.create(createExpenseDto, userId)).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })

  describe('getAllExpense', () => {
    it('지출 목록 조회에 성공했습니다.', async () => {
      const result = [new Expense(), new Expense()]
      jest.spyOn(service, 'getAllExpense').mockResolvedValue(result)

      expect(await controller.getAllExpense('userId')).toBe(result)
    })
  })

  describe('getOneExpense', () => {
    it('지출 상세 조회에 성공했습니다.', async () => {
      const expenseId = 1
      const userId = 'userId'
      const result = new Expense()
      jest.spyOn(service, 'getOneExpense').mockResolvedValue(result)

      expect(await controller.getOneExpense(expenseId, userId)).toBe(result)
      expect(service.getOneExpense).toHaveBeenCalledWith(+expenseId, userId)
    })
  })

  describe('update', () => {
    it('지출 수정에 성공했습니다.', async () => {
      const updateExpenseDto: UpdateExpenseDto = {
        amount: 2000,
      }
      const result = new Expense()
      jest.spyOn(service, 'updateExpense').mockResolvedValue(result)

      expect(await controller.update('1', updateExpenseDto, 'userId')).toBe(
        result,
      )
    })
  })

  describe('delete', () => {
    it('지출 삭제에 성공했습니다.', async () => {
      jest.spyOn(service, 'deleteExpense').mockResolvedValue(undefined)

      await expect(controller.delete(1, 'userId')).resolves.toBeUndefined()
    })
  })
  describe('recommendExpense', () => {
    it('오늘의 지출을 추천에 성공했습니다.', async () => {
      const result = {
        totalDailyBudget: 34929,
        todayRecommendedExpenseByCategoryExcludingTotal: [
          {
            categoryId: 2,
            todaysRecommendedExpenditureAmount: 10357,
          },
          {
            categoryId: 3,
            todaysRecommendedExpenditureAmount: 1429,
          },
          {
            categoryId: 4,
            todaysRecommendedExpenditureAmount: 5000,
          },
          {
            categoryId: 5,
            todaysRecommendedExpenditureAmount: 13929,
          },
          {
            categoryId: 6,
            todaysRecommendedExpenditureAmount: 3214,
          },
          {
            categoryId: 7,
            todaysRecommendedExpenditureAmount: 1000,
          },
        ],
        message: '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!',
      }
      jest.spyOn(service, 'recommendExpense').mockResolvedValue(result)

      expect(await controller.recommendExpense('userId')).toBe(result)
    })
  })

  describe('guideExpense', () => {
    it('오늘의 지출 안내에 성공했습니다.', async () => {
      const result = [
        {
          categoryId: 2,
          todaysSpentAmount: {},
          degreeOfDanger: 'Infinity',
        },
        {
          categoryId: 3,
          todaysSpentAmount: {},
          degreeOfDanger: 'NaN',
        },
        {
          categoryId: 4,
          todaysSpentAmount: {},
          degreeOfDanger: 'NaN',
        },
        {
          categoryId: 5,
          todaysSpentAmount: {},
          degreeOfDanger: 'NaN',
        },
        {
          categoryId: 6,
          todaysSpentAmount: {},
          degreeOfDanger: 'NaN',
        },
      ]
      jest.spyOn(service, 'guideExpense').mockResolvedValue(result)

      expect(await controller.guideExpense('userId')).toBe(result)
    })
  })

  describe('compareRatioToLastMont', () => {
    it('지난달과의 지출 비교해 소비율 계산에 성공했습니다.', async () => {
      const result = [
        {
          categoryId: 2,
          lastMonthAmount: 20000,
          thisMonthAmount: 10000,
          ratio: '200.00%',
        },
        {
          categoryId: 3,
          lastMonthAmount: 3000,
          thisMonthAmount: 2000,
          ratio: '150.00%',
        },
        {
          categoryId: 4,
          lastMonthAmount: 15000,
          thisMonthAmount: 5000,
          ratio: '300.00%',
        },
        {
          categoryId: 6,
          lastMonthAmount: 10000,
          thisMonthAmount: 2000,
          ratio: '500.00%',
        },
      ]
      jest.spyOn(service, 'compareRatioToLastMonth').mockResolvedValue(result)

      expect(await controller.compareRatioToLastMonth('userId')).toBe(result)
    })
  })

  describe('compareRatioToLastWeek', () => {
    it('지난수 지출과 비교해 소비율 계산에 성공했습니다.', async () => {
      const result = [
        {
          categoryId: 2,
          lastWeekAmount: 15000,
          thisWeekAmount: 0,
          ratio: '0.00%',
        },
        {
          categoryId: 3,
          lastWeekAmount: 2000,
          thisWeekAmount: 0,
          ratio: '0.00%',
        },
        {
          categoryId: 4,
          lastWeekAmount: 5000,
          thisWeekAmount: 0,
          ratio: '0.00%',
        },
        {
          categoryId: 6,
          lastWeekAmount: 2000,
          thisWeekAmount: 0,
          ratio: '0.00%',
        },
      ]
      jest.spyOn(service, 'compareRatioToLastWeek').mockResolvedValue(result)

      expect(await controller.compareRatioToLastWeek('userId')).toBe(result)
    })
  })
})
