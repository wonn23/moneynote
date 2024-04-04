export interface RecommendedExpense {
  availableDailyExpense: number
  filteredTodayRecommendedExpenseByCategory: RecommendedExpenseAmount[]
  message: string
}

export interface ExpenseAmount {
  categoryId: number
  amount: string
}

export interface RecommendedExpenseAmount {
  categoryId: number
  categoryName: string
  todaysRecommendedExpenseAmount: number
}
