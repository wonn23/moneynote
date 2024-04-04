export interface IExpenseCalculationService {
  calculateRemainingBudget(
    budgetAmount: number,
    totalSpentAmount: number,
  ): number
  calculateDailyBudget(
    remainingBudget: number,
    remainingDays: number,
    minBudget: number,
  ): number
}
