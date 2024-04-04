export interface IExpenseMessageService {
  getRecommendationMessage(
    availableDailyBudget: number,
    dailyBudgetAllowance: number,
  ): string
}
