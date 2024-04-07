export interface GuideExpense {
  categoryName: string
  ratio: string
}
export interface ExpenseCompatisonResult {
  categoryId: number
  lastMonthAmount: number
  thisMonthAmount: number
  ratio: string
}

export interface ExpenseComparisonWeek {
  categoryId: number
  lastWeekAmount: number
  thisWeekAmount: number
  ratio: string
}
