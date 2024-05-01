import {
  IEXPENSE_CALCULATION_SERVICE,
  IEXPENSE_MESSAGE_SERVICE,
  IEXPENSE_SERVICE,
} from 'src/common/utils/constants'
import { ExpenseService } from './expense.service'
import { ExpenseMessageService } from './expense.message.service'
import { ExpenseCalculationService } from './expense.calculation.service'

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
