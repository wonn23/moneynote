export interface IExpenseMessageService {
  getRecommendationMessage(
    availableDailyExpense: number,
    dailyBudgetAllowance: number,
  ): string
}
