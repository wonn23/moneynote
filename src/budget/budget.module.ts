import { Module } from '@nestjs/common'
import { BudgetController } from './budget.controller'
import { PassportModule } from '@nestjs/passport'
import { BudgetProvider } from './budget.provider'
import { TypeOrmExModule } from 'src/common/decorator/typeorm-ex.module'
import { BudgetRepository } from './budget.repository'
import { CategoryRepository } from './category.repository'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([BudgetRepository, CategoryRepository]),
  ],
  controllers: [BudgetController],
  providers: [...BudgetProvider],
  exports: [...BudgetProvider],
})
export class BudgetModule {}
