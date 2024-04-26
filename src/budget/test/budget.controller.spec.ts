import { Test, TestingModule } from '@nestjs/testing'
import { BudgetController } from '../budget.controller'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { categoryEnum } from '../types/budget.enum'
import { User } from 'src/user/entities/user.entity'
import { Budget } from '../entities/budget.entity'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { Category } from '../entities/category.entity'
import {
  MockService,
  MockServiceFactory,
} from 'src/common/utils/mock-service.factory'
import { IBUDGET_SERVICE } from 'src/common/utils/constants'
import { IBudgetService } from '../interfaces/budget.service.interface'
import { JwtAccessAuthGuard } from 'src/auth/guard/jwt-access.guard'
import { BudgetService } from '../budget.service'
import { BudgetAmount } from '../interfaces/budget-design.interface'

const mockUser = {
  id: 'testUserId',
  username: 'testUsername',
  email: 'test@example.com',
  password: 'hashedPassword',
  providerId: 'testProviderId',
  consultingYn: false,
  discordUrl: '',
} as User

const mockBudget = {
  id: 1,
  year: 2024,
  month: 1,
  amount: 1000000,
  category: {
    id: 2,
    name: '식사',
  },
} as Budget

const userId = mockUser.id

describe('BudgetController', () => {
  let budgetController: BudgetController
  let budgetService: MockService<IBudgetService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: IBUDGET_SERVICE,
          useValue: MockServiceFactory.getMockService(BudgetService),
        },
      ],
    })
      .overrideGuard(JwtAccessAuthGuard)
      .useValue({ canActivate: () => true })
      .compile()

    budgetController = module.get<BudgetController>(BudgetController)
    budgetService = module.get(IBUDGET_SERVICE)
  })

  it('should be defined', () => {
    expect(budgetController).toBeDefined()
    expect(budgetService).toBeDefined()
  })

  describe('create', () => {
    it('budgetService.createBudget을 부릅니다.', async () => {
      const createBudgetDto: CreateBudgetDto = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: categoryEnum.food,
      }

      const result = mockBudget
      jest
        .spyOn(budgetService, 'createBudget')
        .mockImplementation(async () => result)

      await budgetController.create(createBudgetDto, userId)

      expect(budgetService.createBudget).toHaveBeenCalledWith(
        createBudgetDto,
        userId,
      )
    })
  })

  describe('design', () => {
    it('예산 설계 성공', async () => {
      const totalAmount = 1000000
      const year = 2024
      const month = 1
      const expectedDesignResult: BudgetAmount[] = [
        {
          categoryName: '교통',
          budgetAmount: 120000,
        },
        {
          categoryName: '문화생활',
          budgetAmount: 220000,
        },
        {
          categoryName: '식사',
          budgetAmount: 320000,
        },
        {
          categoryName: '주거/통신',
          budgetAmount: 210000,
        },
        {
          categoryName: '기타',
          budgetAmount: 130000,
        },
      ]

      jest
        .spyOn(budgetService, 'designBudget')
        .mockResolvedValue(expectedDesignResult)

      const result = await budgetController.design(totalAmount, year, month)

      expect(budgetService.designBudget).toHaveBeenCalledWith(
        totalAmount,
        year,
        month,
      )
      expect(result).toEqual(expectedDesignResult)
    })
  })

  describe('findBudgets', () => {
    it('연도별 예산 조회 성공', async () => {
      const year = 2024
      const month = undefined
      const expectedBudgets: Budget[] = [mockBudget]

      jest
        .spyOn(budgetService, 'findBudgets')
        .mockResolvedValue(expectedBudgets)

      const result = await budgetController.findBudgets(userId, year, month)

      expect(budgetService.findBudgets).toHaveBeenCalledWith(userId, year)
      expect(result).toEqual(expectedBudgets)
    })

    it('연도와 월별 예산 조회 성공', async () => {
      const year = 2024
      const month = 1
      const expectedBudgets: Budget[] = [mockBudget]

      jest
        .spyOn(budgetService, 'findBudgets')
        .mockResolvedValue(expectedBudgets)

      const reuslt = await budgetController.findBudgets(userId, year, month)

      expect(budgetService.findBudgets).toHaveBeenCalledWith(
        userId,
        year,
        month,
      )
      expect(reuslt).toEqual(expectedBudgets)
    })
  })

  describe('update', () => {
    it('예산 수정 성공', async () => {
      const updateBudgetDto: UpdateBudgetDto = {
        amount: 200000,
        category: categoryEnum.food,
      }
      const expectedUpdatedBudget: Budget = {
        id: mockBudget.id,
        year: mockBudget.year,
        month: mockBudget.month,
        amount: updateBudgetDto.amount,
        category: { id: 2, name: updateBudgetDto.category } as Category,
        user: mockUser,
      } as Budget

      jest
        .spyOn(budgetService, 'updateBudget')
        .mockResolvedValue(expectedUpdatedBudget)

      const result = await budgetController.update(
        mockBudget.id,
        updateBudgetDto,
        userId,
      )

      expect(budgetService.updateBudget).toHaveBeenCalledWith(
        mockBudget.id,
        updateBudgetDto,
        userId,
      )
      expect(result).toEqual(expectedUpdatedBudget)
    })
  })

  describe('delete', () => {
    it('예산 삭제 성공', async () => {
      jest.spyOn(budgetService, 'deleteBudget').mockResolvedValue(undefined)

      await budgetController.delete(mockBudget.id)

      expect(budgetService.deleteBudget).toHaveBeenCalledWith(mockBudget.id)
    })
  })
})
