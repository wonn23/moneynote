import { CustomRepository } from 'src/common/decorator/typeorm-ex.decorator'
import { Repository } from 'typeorm'
import { Expense } from './entities/expense.entity'

@CustomRepository(Expense)
export class ExpenseRepository extends Repository<Expense> {}
