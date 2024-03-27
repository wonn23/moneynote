import { IsEnum, IsInt, Min } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'
import { ApiProperty } from '@nestjs/swagger'

export class CreateBudgetDto {
  @IsInt()
  @ApiProperty({ description: '연도', example: 2024 })
  year: number

  @IsInt()
  @ApiProperty({ description: '월', example: 1 })
  month: number

  @IsInt()
  @ApiProperty({ description: '예산', example: 1000000 })
  @Min(0, { message: '금액은 0원 이상이어야 합니다.' })
  amount: number

  @IsEnum(categoryEnum)
  @ApiProperty({
    description: '지출 카테고리',
    example: categoryEnum.food,
    enum: categoryEnum,
  })
  category: categoryEnum
}
