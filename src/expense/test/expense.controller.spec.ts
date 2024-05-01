import { Test, TestingModule } from '@nestjs/testing'
import { ExpenseController } from '../expense.controller'
import { ExpenseService } from '../expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { categoryEnum } from 'src/budget/types/budget.enum'
import { Expense } from '../entities/expense.entity'
import { InternalServerErrorException } from '@nestjs/common'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { IExpenseSerivce } from '../interfaces/expense.service.interface'
import { IEXPENSE_SERVICE } from 'src/common/utils/constants'

const mockUser = {
  id: 'testUserId',
  username: 'testUsername',
  email: 'test@example.com',
  password: 'hashedPassword',
  consultingYn: false,
  discordUrl: '',
}
const userId = mockUser.id
const mockExpense = {
  id: 1,
  amount: 10000,
  memo: '점심식사',
  isExcluded: false,
  cateogory: {
    id: 2,
    name: categoryEnum.food,
  },
  user: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ExpenseController', () => {
  let expenseController: ExpenseController
  let expenseService: MockService<IExpenseSerivce>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [
        {
          provide: IEXPENSE_SERVICE,
          useValue: MockServiceFactory.getMockService(ExpenseService),
        },
      ],
    }).compile()

    expenseController = module.get<ExpenseController>(ExpenseController)
    expenseService = module.get(IEXPENSE_SERVICE)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(expenseController).toBeDefined()
    expect(expenseService).toBeDefined()
  })

  describe('create', () => {
    const createExpenseDto: CreateExpenseDto = {
      amount: 10000,
      memo: '저녁 식사',
      isExcluded: false,
      category: categoryEnum.food,
    }

    it('지출 생성에 성공했습니다.', async () => {
      expenseService.createExpense.mockResolvedValue(mockExpense)

      const result = await expenseController.create(createExpenseDto, userId)

      expect(expenseService.createExpense).toHaveBeenCalledWith(
        createExpenseDto,
        userId,
      )
      expect(result).toEqual(mockExpense)
    })

    it('지출 생성에 실패했습니다.', async () => {
      const userId = 'userId'
      jest
        .spyOn(expenseService, 'createExpense')
        .mockRejectedValue(new InternalServerErrorException())

      await expect(
        expenseController.create(createExpenseDto, userId),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('getAllExpense', () => {
    it('지출 목록 조회에 성공했습니다.', async () => {
      const result = [new Expense(), new Expense()]
      jest.spyOn(expenseService, 'getAllExpense').mockResolvedValue(result)

      expect(
        await expenseController.getAllExpense(
          userId,
          '2024-04-01',
          '2024-04-30',
        ),
      ).toEqual(result)
    })
  })

  describe('getOneExpense', () => {
    it('지출 상세 조회에 성공했습니다.', async () => {
      const expenseId = 1
      const userId = 'userId'
      const result = new Expense()
      jest.spyOn(expenseService, 'getOneExpense').mockResolvedValue(result)

      expect(await expenseController.getOneExpense(expenseId, userId)).toEqual(
        result,
      )
      expect(expenseService.getOneExpense).toHaveBeenCalledWith(
        expenseId,
        userId,
      )
    })
  })

  describe('update', () => {
    it('지출 수정에 성공했습니다.', async () => {
      const updateExpenseDto: UpdateExpenseDto = {
        amount: 2000,
      }
      const result = new Expense()
      jest.spyOn(expenseService, 'updateExpense').mockResolvedValue(result)

      expect(
        await expenseController.update('1', updateExpenseDto, 'userId'),
      ).toEqual(result)
    })
  })

  describe('delete', () => {
    it('지출 삭제에 성공했습니다.', async () => {
      jest.spyOn(expenseService, 'deleteExpense').mockResolvedValue(undefined)

      await expect(
        expenseController.delete(1, 'userId'),
      ).resolves.toBeUndefined()
    })
  })
  describe('recommendExpense', () => {
    it('오늘의 지출을 추천에 성공했습니다.', async () => {
      const result = {
        totalDailyBudget: 34929,
        todayRecommendedExpenseByCategoryExcludingTotal: [
          {
            categoryId: 2,
            categoryName: '식사',
            todaysRecommendedExpenditureAmount: 10357,
          },
          {
            categoryId: 3,
            categoryName: '교통',
            todaysRecommendedExpenditureAmount: 1429,
          },
          {
            categoryId: 4,
            categoryName: '문화생활',
            todaysRecommendedExpenditureAmount: 5000,
          },
          {
            categoryId: 5,
            categoryName: '주거/통신',
            todaysRecommendedExpenditureAmount: 13929,
          },
          {
            categoryId: 6,
            categoryName: '생활용품',
            todaysRecommendedExpenditureAmount: 3214,
          },
          {
            categoryId: 7,
            categoryName: '기타',
            todaysRecommendedExpenditureAmount: 0,
          },
        ],
        message: '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!',
      }
      jest.spyOn(expenseService, 'recommendExpense').mockResolvedValue(result)

      expect(await expenseController.recommendExpense('userId')).toEqual(result)
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
      jest.spyOn(expenseService, 'guideExpense').mockResolvedValue(result)

      expect(await expenseController.guideExpense('userId')).toEqual(result)
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
      jest
        .spyOn(expenseService, 'compareRatioToLastMonth')
        .mockResolvedValue(result)

      expect(await expenseController.compareRatioToLastMonth('userId')).toEqual(
        result,
      )
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
      jest
        .spyOn(expenseService, 'compareRatioToLastWeek')
        .mockResolvedValue(result)

      expect(await expenseController.compareRatioToLastWeek('userId')).toEqual(
        result,
      )
    })
  })
})
