import { Module } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { ScheduleModule } from '@nestjs/schedule'
import { HttpModule } from '@nestjs/axios'
import { WebhookController } from './webhook.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Budget } from 'src/budget/entities/budget.entity'
import { Expense } from 'src/expense/entities/expense.entity'
import { Category } from 'src/budget/entities/category.entity'
import { ExpenseModule } from 'src/expense/expense.module'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    ExpenseModule,
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Budget, Expense, Category]),
    HttpModule,
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
})
export class WebhookModule {}
