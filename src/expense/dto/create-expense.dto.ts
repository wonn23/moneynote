import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator'
import { categoryEnum } from 'src/budget/types/budget.enum'

export class CreateExpenseDto {
  @IsNumber()
  amount: number

  @IsString()
  memo?: string

  @IsBoolean()
  isExcluded: boolean

  @IsEnum(categoryEnum)
  category: categoryEnum
}
