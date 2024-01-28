import {
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  Min,
} from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

export class CreateBudgetDto {
  @IsInt()
  year: number

  @IsInt()
  month: number

  @IsInt()
  @Min(0, { message: '금액은 0원 이상이어야 합니다.' })
  amount: number

  @IsEnum(categoryEnum)
  category: categoryEnum
}
