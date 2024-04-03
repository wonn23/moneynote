import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Budget } from '../entities/budget.entity'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetDesign } from './budget-design.interface'

export interface IBudgetService {
  createBudget(
    createBudgetDto: CreateBudgetDto,
    userId: string,
  ): Promise<Budget>
  designBudget(
    totalAmount: number,
    year: number,
    month: number,
  ): Promise<BudgetDesign[]>
  findBudgetByYear(year: number, userId: string): Promise<Budget[]>
  findBudgetByYearAndMonth(
    year: number,
    month: number,
    userId: string,
  ): Promise<Budget[]>
  updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<Budget>
  deleteBudget(id: number): Promise<void>
}
