import {
  IBUDGET_DESIGN_STRAGTEGY,
  IBUDGET_SERVICE,
} from 'src/common/utils/constants'
import { BudgetService } from './budget.service'
import { DefaultBudgetDesignStrategy } from './budget-design-strategy'

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
