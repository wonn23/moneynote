export interface RecommendedExpense {
  availableDailyBudget: number
  filteredTodayRecommendedExpenseByCategory: RecommendedExpenseDetail[]
  message: string
}

export interface RecommendedExpenseDetail {
  categoryName: string
  todaysRecommendedExpenseAmount: number
}
