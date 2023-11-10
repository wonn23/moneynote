import { Test, TestingModule } from '@nestjs/testing'
import { ExpenseController } from '../controllers/expense.controller'
import { ExpenseService } from '../services/expense.service'

describe('ExpenseController', () => {
  let controller: ExpenseController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [ExpenseService],
    }).compile()

    controller = module.get<ExpenseController>(ExpenseController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
