import { PartialType } from '@nestjs/swagger'
import { CreateBudgetDto } from './create-budget.dto'
import { IsBoolean, IsEnum, IsInt, IsString } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsInt()
  amount: number

  @IsString()
  memo: string

  @IsBoolean()
  isExcluded: boolean

  @IsEnum(categoryEnum)
  category: categoryEnum
}
