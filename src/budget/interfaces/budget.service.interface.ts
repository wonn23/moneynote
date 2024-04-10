import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Budget } from '../entities/budget.entity'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetAmount } from './budget-design.interface'

export interface IBudgetService {
  createBudget(
    createBudgetDto: CreateBudgetDto,
    userId: string,
  ): Promise<Budget>
  designBudget(
    totalAmount: number,
    year: number,
    month: number,
  ): Promise<BudgetAmount[]>
  findBudgets(userId: string, year: number, month?: number): Promise<Budget[]>
  updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<Budget>
  deleteBudget(id: number): Promise<void>
}
