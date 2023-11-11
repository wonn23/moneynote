import { Module } from '@nestjs/common'
import { BudgetService } from './services/budget.service'
import { BudgetController } from './controllers/budget.controller'
import { BudgetRepository } from './repositories/budget.repository'
import { Budget } from './entities/budget.entity'
import { TypeOrmExModule } from 'src/common/typeorm-ex.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Category } from './entities/category.entity'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([BudgetRepository]),
    TypeOrmModule.forFeature([Budget, Category]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
