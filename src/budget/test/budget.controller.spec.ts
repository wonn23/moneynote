import { Test, TestingModule } from '@nestjs/testing'
import { BudgetController } from '../controllers/budget.controller'
import { BudgetService } from '../services/budget.service'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { categoryEnum } from '../types/budget.enum'
import { User } from 'src/user/entities/user.entity'
import { Budget } from '../entities/budget.entity'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { Category } from '../entities/category.entity'

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}))

describe('BudgetController', () => {
  let controller: BudgetController
  let service: BudgetService

  const mockUser = {
    id: '1',
    username: 'testUsername',
    password: 'testPassword',
    consultingYn: true,
    discordUrl: 'http://example.com',
  }

  beforeEach(async () => {
    const mockBudgetService = {
      createBudget: jest.fn(),
      designBudget: jest.fn(),
      getUserAverageRatio: jest.fn(),
      findBudgetByYear: jest.fn(),
      findBudgetByYearAndMonth: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: BudgetService,
          useValue: mockBudgetService,
        },
      ],
    }).compile()

    controller = module.get<BudgetController>(BudgetController)
    service = module.get<BudgetService>(BudgetService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(service).toBeDefined()
  })
  describe('create', () => {
    it('예산 생성 성공', async () => {
      const createBudgetDto: CreateBudgetDto = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: categoryEnum.food,
      }

      const result = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: {
          id: 2,
          name: '식사',
        },
      }

      jest
        .spyOn(service, 'createBudget')
        .mockImplementation(async () => result as Budget)

      expect(await controller.create(createBudgetDto, mockUser as User)).toBe(
        result,
      )
    })
  })

  describe('design', () => {
    it('예산 설계 성공', async () => {
      const totalAmount = 1000000
      const year = 2024
      const month = 1
      const expectedDesignResult = [
        {
          category: '교통',
          budget: 120000,
        },
        {
          category: '문화생활',
          budget: 220000,
        },
        {
          category: '식사',
          budget: 320000,
        },
        {
          category: '주거/통신',
          budget: 210000,
        },
        {
          category: '기타',
          budget: 130000,
        },
      ]

      jest
        .spyOn(service, 'designBudget')
        .mockResolvedValue(expectedDesignResult)

      expect(await controller.design(totalAmount, year, month)).toBe(
        expectedDesignResult,
      )
    })
  })

  describe('findBudgetByYear', () => {
    it('연도로 예산 조회 성공', async () => {
      const year = 2024
      const expectedBudgets: Budget[] = [
        {
          id: 32,
          year: 2024,
          month: 1,
          amount: 3000000,
          category: { id: 2 } as Category,
          user: { id: 'user-id' } as User,
        } as Budget,
      ]

      jest.spyOn(service, 'findBudgetByYear').mockResolvedValue(expectedBudgets)

      expect(await controller.findBudgetByYear(year, mockUser as User)).toBe(
        expectedBudgets,
      )
    })
  })

  describe('findBudgetByYearAndMonth', () => {
    it('연월로 예산 조회 성공', async () => {
      const year = 2024
      const month = 1
      const expectedBudgets: Budget[] = [
        {
          id: 32,
          year: 2024,
          month: 1,
          amount: 3000000,
          category: { id: 2 } as Category,
          user: { id: 'user-id' } as User,
        } as Budget,
      ]

      jest
        .spyOn(service, 'findBudgetByYearAndMonth')
        .mockResolvedValue(expectedBudgets)

      expect(
        await controller.findBudgetByYearAndMonth(
          year,
          month,
          mockUser as User,
        ),
      ).toBe(expectedBudgets)
    })
  })

  describe('update', () => {
    it('예산 수정 성공', async () => {
      const id = '1'
      const updateBudgetDto: UpdateBudgetDto = {
        amount: 200000,
        category: categoryEnum.food,
      }
      const expectedUpdatedBudget: Budget = {
        id: 32,
        year: 2024,
        month: 1,
        amount: 3000000,
        category: { id: 2, name: '식사' } as Category,
        user: { id: 'user-id' } as User,
      } as Budget

      jest
        .spyOn(service, 'updateBudget')
        .mockResolvedValue(expectedUpdatedBudget)

      expect(
        await controller.update(id, updateBudgetDto, mockUser as User),
      ).toBe(expectedUpdatedBudget)
    })
  })

  describe('delete', () => {
    it('예산 삭제 성공', async () => {
      const id = '1'

      jest.spyOn(service, 'deleteBudget').mockResolvedValue(undefined)

      await expect(controller.delete(id)).resolves.not.toThrow()
    })
  })
})
