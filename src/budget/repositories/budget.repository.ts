import { Repository } from 'typeorm'
import { CustomRepository } from '../../common/typeorm-ex.decorator'
import { Budget } from '../entities/budget.entity'

@CustomRepository(Budget)
export class BudgetRepository extends Repository<Budget> {
  async getBudgetByYearMonthPattern(yearMonth: string) {}
}
