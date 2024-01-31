import { Module } from '@nestjs/common'
import { BudgetService } from './services/budget.service'
import { BudgetStatsService } from './services/budgetStats.service'
import { BudgetController } from './controllers/budget.controller'
import { BudgetRepository } from './repositories/budget.repository'
import { Budget } from './entities/budget.entity'
import { TypeOrmExModule } from 'src/common/typeorm-ex.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Category } from './entities/category.entity'
import { PassportModule } from '@nestjs/passport'
import { CategoryRepository } from './repositories/category.repository'
import { UserRepository } from 'src/user/repositories/user.repository'
import { User } from 'src/user/entities/user.entity'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmExModule.forCustomRepository([
      BudgetRepository,
      CategoryRepository,
      UserRepository,
    ]),
    TypeOrmModule.forFeature([Budget, Category, User]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetStatsService],
})
export class BudgetModule {}
