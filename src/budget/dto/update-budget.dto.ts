import { PartialType } from '@nestjs/swagger'
import { CreateBudgetDto } from './create-budget.dto'
import { IsEnum, IsInt } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsInt()
  amount: number

  @IsEnum(categoryEnum)
  category: categoryEnum
}
