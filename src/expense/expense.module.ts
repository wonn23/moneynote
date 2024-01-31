import { Module } from '@nestjs/common'
import { ExpenseService } from './services/expense.service'
import { ExpenseController } from './controllers/expense.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmExModule } from 'src/common/typeorm-ex.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from './entities/expense.entity'
import { ExpenseRepository } from './repositories/expense.repository'
import { UserRepository } from 'src/user/repositories/user.repository'
import { CategoryRepository } from 'src/budget/repositories/category.repository'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([
      ExpenseRepository,
      CategoryRepository,
      UserRepository,
    ]),
    TypeOrmModule.forFeature([Expense]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
