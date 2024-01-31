import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateExpenseDto {
  @IsNumber()
  amount: number

  @IsString()
  memo?: string

  @IsString()
  content: string

  @IsBoolean()
  isExcluded: boolean
}
