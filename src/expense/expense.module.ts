import { Module } from '@nestjs/common'
import { ExpenseService } from './services/expense.service'
import { ExpenseController } from './controllers/expense.controller'

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
