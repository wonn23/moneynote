import {
  IEXPENSE_CALCULATION_SERVICE,
  IEXPENSE_MESSAGE_SERVICE,
  IEXPENSE_SERVICE,
} from 'src/common/utils/constants'
import { ExpenseService } from './services/expense.service'
import { ExpenseMessageService } from './services/expense.message.service'
import { ExpenseCalculationService } from './services/expense.calculation.service'

export const ExpenseProvider = [
  {
    provide: IEXPENSE_SERVICE,
    useClass: ExpenseService,
  },
  {
    provide: IEXPENSE_CALCULATION_SERVICE,
    useClass: ExpenseCalculationService,
  },
  { provide: IEXPENSE_MESSAGE_SERVICE, useClass: ExpenseMessageService },
]
