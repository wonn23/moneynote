import { Module } from '@nestjs/common'
import { ExpenseService } from './services/expense.service'
import { ExpenseController } from './controllers/expense.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmExModule } from 'src/common/typeorm-ex.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from './entities/expense.entity'
import { UserRepository } from 'src/user/repositories/user.repository'
import { Category } from 'src/budget/entities/category.entity'
import { Budget } from 'src/budget/entities/budget.entity'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([UserRepository]),
    TypeOrmModule.forFeature([Budget, Expense, Category]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
