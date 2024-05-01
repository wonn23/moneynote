import { Module } from '@nestjs/common'
import { ExpenseController } from './expense.controller'
import { PassportModule } from '@nestjs/passport'
import { ExpenseProvider } from './expense.provider'
import { BudgetModule } from 'src/budget/budget.module'
import { TypeOrmExModule } from 'src/common/decorator/typeorm-ex.module'
import { CategoryRepository } from 'src/budget/category.repository'
import { ExpenseRepository } from './expense.repository'
import { UserRepository } from 'src/user/user.repository'

@Module({
  imports: [
    BudgetModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([
      CategoryRepository,
      ExpenseRepository,
      UserRepository,
    ]),
  ],

  controllers: [ExpenseController],
  providers: [...ExpenseProvider],
  exports: [...ExpenseProvider],
})
export class ExpenseModule {}
