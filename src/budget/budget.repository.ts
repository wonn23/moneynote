import { CustomRepository } from 'src/common/decorator/typeorm-ex.decorator'
import { Repository } from 'typeorm'
import { Budget } from './entities/budget.entity'

@CustomRepository(Budget)
export class BudgetRepository extends Repository<Budget> {}
