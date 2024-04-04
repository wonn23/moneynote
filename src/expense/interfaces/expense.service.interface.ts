import { RecommendedExpense } from './expense-recommend.interface'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { Expense } from '../entities/expense.entity'

export interface IExpenseSerivce {
  createExpense(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense>
  getAllExpense(userId: string): Promise<Expense[]>
  getOneExpense(expenseId: number, userId: string): Promise<Expense>
  updateExpense(
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense>
  deleteExpense(expenseId: number, userId: string): Promise<void>
  recommendExpense(userId: string): Promise<RecommendedExpense>
  guideExpense(userId: string)
  compareRatioToLastMonth(userId: string)
  compareRatioToLastWeek(userId: string)
}
