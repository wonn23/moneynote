import { IsEnum, IsInt, IsString, Matches, Min } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

const YYYY_MM_Format = /^\d{4}-(1[0-2]|0[1-9])$/

export class CreateBudgetDto {
  @Matches(YYYY_MM_Format, {
    message:
      'yearMonth는 "YYYY-MM" 형식이어야 하며 MM은 01부터 12까지 가능합니다.',
  })
  @IsString()
  yearMonth: string

  @IsInt()
  @Min(0, { message: '금액은 0원 이상이어야 합니다.' })
  amount: number

  @IsEnum(categoryEnum)
  category: string
}
