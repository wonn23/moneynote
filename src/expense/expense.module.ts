import { Module } from '@nestjs/common'
import { ExpenseService } from './services/expense.service'
import { ExpenseController } from './controllers/expense.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmExModule } from 'src/common/typeorm-ex.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from './entities/expense.entity'
import { ExpenseRepository } from './repositories/expense.repository'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([ExpenseRepository]),
    TypeOrmModule.forFeature([Expense]),
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
