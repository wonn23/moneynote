export interface BudgetDesign {
  categoryName: string
}

export interface AverageAmount extends BudgetDesign {
  averageAmount: string
}

export interface Ratio extends BudgetDesign {
  ratio: string
}

export interface BudgetAmount extends BudgetDesign {
  budgetAmount: number
}

export interface IBudgetDesignStrategy {
  designBudget(ratio: Ratio[], totalAmount: number): Promise<BudgetAmount[]>
}
