import { Injectable } from '@nestjs/common'
import { IExpenseCalculationService } from '../interfaces/expense.calculation.service.interface'
import { Budget } from 'src/budget/entities/budget.entity'
import {
  ExpenseAmount,
  RecommendedExpenseAmount,
} from '../interfaces/expense-recommend.interface'
import { GuideExpense } from '../interfaces/expense-guide.interface'

@Injectable()
export class ExpenseCalculationService implements IExpenseCalculationService {
  calculateRecommendedExpenses(
    budgets: Budget[],
    expenses: ExpenseAmount[],
    today: Date,
    minBudget: number,
  ): RecommendedExpenseAmount[] {
    // 오늘부터 이번달 말까지 몇일 남았는지 계산
    const remainingDays = this.calculateRemainingDays(today)

    return budgets.map((budget) => {
      // 지출이 undedined이면 기본값을 '0'원으로 한다.
      const expense = expenses.find(
        (e) => e.categoryId === budget.category.id,
      ) || { amount: '0' }
      const totalSpentAmount = parseInt(expense.amount, 10)

      // 오늘까지 남은 예산 계산
      const remainingBudget = this.calculateRemainingBudget(
        budget.amount,
        totalSpentAmount,
      )

      // 오늘 추천 지출 금액 계산
      let todaysRecommendedExpenseAmount = this.calculateDailyBudget(
        remainingBudget,
        remainingDays,
        minBudget,
      )

      // 예산이 0원인 카테고리는 0원 추천
      // 남은 예산이 minBudget보다 작으면 오늘의 추천 금액은 minBudget을 추천
      if (
        budget.amount === 0 ||
        (remainingBudget <= 0 && todaysRecommendedExpenseAmount < minBudget)
      ) {
        todaysRecommendedExpenseAmount = 0
      } else if (todaysRecommendedExpenseAmount < minBudget) {
        todaysRecommendedExpenseAmount = minBudget
      }
      return {
        categoryId: budget.category.id,
        categoryName: budget.category.name,
        todaysRecommendedExpenseAmount,
      }
    })
  }

  private calculateRemainingDays(today: Date): number {
    const totalDays = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate()
    return Math.max(totalDays - today.getDate() + 1, 1)
  }

  private calculateRemainingBudget(
    budgetAmount: number,
    totalSpentAmount: number,
  ): number {
    return Math.max(budgetAmount - totalSpentAmount, 0)
  }

  private calculateDailyBudget(
    remainingBudget: number,
    remainingDays: number,
    minBudget: number,
  ): number {
    const todaysRecommendedExpenseAmount =
      Math.floor(remainingBudget / remainingDays / 100) * 100
    return Math.max(todaysRecommendedExpenseAmount, minBudget)
  }

  calculateExpenseRatios(
    recommendedExpenses: RecommendedExpenseAmount[],
    actualExpenses: ExpenseAmount[],
  ): GuideExpense[] {
    return recommendedExpenses.map((recommended) => {
      const actualExpense = actualExpenses.find(
        (expense) => expense.categoryId === recommended.categoryId,
      )
      const actualAmount = actualExpense ? parseFloat(actualExpense.amount) : 0
      const ratio = this.calculateRatio(
        actualAmount,
        recommended.todaysRecommendedExpenseAmount,
      )
      return {
        categoryName: recommended.categoryName,
        ratio: `${ratio.toFixed(2)}%`,
      }
    })
  }

  private calculateRatio(
    actualAmount: number,
    recommendedAmount: number,
  ): number {
    return actualAmount > 0 ? (actualAmount / recommendedAmount) * 100 : 0
  }
}
