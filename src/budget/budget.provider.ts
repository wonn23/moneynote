import { IBUDGET_DESIGN_STRAGTEGY, IBUDGET_SERVICE } from 'src/common/di.tokens'
import { BudgetService } from './services/budget.service'
import { DefaultBudgetDesignStrategy } from './services/default-budget-design.strategy'

export const BudgetProvider = [
  {
    provide: IBUDGET_SERVICE,
    useClass: BudgetService,
  },
  {
    provide: IBUDGET_DESIGN_STRAGTEGY,
    useClass: DefaultBudgetDesignStrategy,
  },
]
