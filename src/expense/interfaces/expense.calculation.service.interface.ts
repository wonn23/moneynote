import { Budget } from 'src/budget/entities/budget.entity'
import {
  ExpenseAmount,
  RecommendedExpenseAmount,
} from './expense-recommend.interface'
import { GuideExpense } from './expense-guide.interface'

export interface IExpenseCalculationService {
  calculateRecommendedExpenses(
    budgets: Budget[],
    expenses: ExpenseAmount[],
    today: Date,
    minBudget: number,
  ): RecommendedExpenseAmount[]

  calculateExpenseRatios(
    recommendedExpenses: RecommendedExpenseAmount[],
    actualExpenses: ExpenseAmount[],
  ): GuideExpense[]
}
