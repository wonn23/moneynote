import { Module } from '@nestjs/common'
import { BudgetController } from './controllers/budget.controller'
import { Budget } from './entities/budget.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Category } from './entities/category.entity'
import { PassportModule } from '@nestjs/passport'
import { User } from 'src/user/entities/user.entity'
import { BudgetProvider } from './budget.provider'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Budget, Category, User]),
  ],
  controllers: [BudgetController],
  providers: [...BudgetProvider],
})
export class BudgetModule {}
