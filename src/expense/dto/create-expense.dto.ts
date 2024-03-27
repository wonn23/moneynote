import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsNumber, IsString } from 'class-validator'
import { categoryEnum } from 'src/budget/types/budget.enum'

export class CreateExpenseDto {
  @IsNumber()
  @ApiProperty({ description: '지출 금액', example: 5000 })
  amount: number

  @IsString()
  @ApiProperty({ description: '메모', example: '점심 식사', required: false })
  memo?: string

  @IsBoolean()
  @ApiProperty({ description: '지출 제외 여부', example: false })
  isExcluded: boolean

  @IsEnum(categoryEnum)
  @ApiProperty({
    description: '지출 카테고리',
    example: categoryEnum.food,
    enum: categoryEnum,
  })
  category: categoryEnum
}
