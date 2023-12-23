import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator'

export class CreateExpenseDto {
  @IsString()
  date: string

  @IsString()
  content: string

  @IsBoolean()
  isSum: boolean
}
