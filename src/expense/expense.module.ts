import { Module } from '@nestjs/common'
import { ExpenseController } from './controllers/expense.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from './entities/expense.entity'
import { Category } from 'src/budget/entities/category.entity'
import { Budget } from 'src/budget/entities/budget.entity'
import { User } from 'src/user/entities/user.entity'
import { ExpenseProvider } from './expense.provider'
import { BudgetModule } from 'src/budget/budget.module'

@Module({
  imports: [
    BudgetModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Budget, Expense, Category, User]),
  ],
  controllers: [ExpenseController],
  providers: [...ExpenseProvider],
  exports: [...ExpenseProvider],
})
export class ExpenseModule {}
