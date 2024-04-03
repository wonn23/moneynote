import { Module } from '@nestjs/common'
import { ExpenseService } from './services/expense.service'
import { ExpenseController } from './controllers/expense.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from './entities/expense.entity'
import { Category } from 'src/budget/entities/category.entity'
import { Budget } from 'src/budget/entities/budget.entity'
import { User } from 'src/user/entities/user.entity'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Budget, Expense, Category, User]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
