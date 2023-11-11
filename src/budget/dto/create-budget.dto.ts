import { IsEnum, IsInt, IsString } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

export class CreateBudgetDto {
  @IsString()
  yearMonth: string

  @IsInt()
  amount: number

  @IsEnum(categoryEnum)
  category: string
}
