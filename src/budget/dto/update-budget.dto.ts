import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateBudgetDto } from './create-budget.dto'
import { IsEnum, IsInt, Min } from 'class-validator'
import { categoryEnum } from '../types/budget.enum'

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsInt()
  @Min(0, { message: '금액은 0원 이상이어야 합니다.' })
  @ApiProperty({ description: '예산', example: 1000000 })
  amount: number

  @IsEnum(categoryEnum)
  @ApiProperty({
    description: '지출 카테고리',
    example: categoryEnum.food,
    enum: categoryEnum,
  })
  category: categoryEnum
}
