import { User } from 'src/user/entities/user.entity'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Budget } from '../entities/budget.entity'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetDesign } from './budget-design.interface'

export interface IBudgetService {
  createBudget(createBudgetDto: CreateBudgetDto, user: User): Promise<Budget>
  designBudget(
    totalAmount: number,
    year: number,
    month: number,
  ): Promise<BudgetDesign[]>
  findBudgetByYear(year: number, user: User): Promise<Budget[]>
  findBudgetByYearAndMonth(
    year: number,
    month: number,
    user: User,
  ): Promise<Budget[]>
  updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    user: User,
  ): Promise<Budget>
  deleteBudget(id: number): Promise<void>
}
