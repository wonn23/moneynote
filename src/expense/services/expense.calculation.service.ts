import { Injectable } from '@nestjs/common'
import { IExpenseCalculationService } from '../interfaces/expense.calculation.service.interface'

@Injectable()
export class ExpenseCalculationService implements IExpenseCalculationService {
  // 남은 예산 계산
  calculateRemainingBudget(
    budgetAmount: number,
    totalSpentAmount: number,
  ): number {
    return Math.max(budgetAmount - totalSpentAmount, 0)
  }

  // 하루 사용 가능 예산 계산
  calculateDailyBudget(
    remainingBudget: number,
    remainingDays: number,
    minBudget: number,
  ): number {
    let dailyBudget = Math.floor(remainingBudget / remainingDays / 100) * 100
    return Math.max(dailyBudget, minBudget)
  }
}
