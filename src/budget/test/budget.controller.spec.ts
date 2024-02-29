import { Test, TestingModule } from '@nestjs/testing'
import { BudgetController } from '../controllers/budget.controller'
import { BudgetService } from '../services/budget.service'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { categoryEnum } from '../types/budget.enum'
import { User } from 'src/user/entities/user.entity'
import { Budget } from '../entities/budget.entity'

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}))

describe('BudgetController', () => {
  let controller: BudgetController
  let service: BudgetService

  beforeEach(async () => {
    const mockBudgetService = {
      createBudget: jest.fn(),
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
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new budget', async () => {
      const createBudgetDto: CreateBudgetDto = {
        year: 2024,
        month: 1,
        amount: 1000000,
        category: categoryEnum.food,
      }

      const mockUser = {
        id: '1',
        username: 'testUsername',
        password: 'testPassword',
        consultingYn: true,
        discordUrl: 'http://example.com',
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
  describe('design', () => {})
  describe('findBudgetByYear', () => {})
  describe('findBudgetByYearAndMonth', () => {})
  describe('update', () => {})
  describe('delete', () => {})
})
