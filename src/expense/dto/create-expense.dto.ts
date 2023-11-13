import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator'

export class CreateExpenseDto {
  @IsString()
  content: string

  @IsBoolean()
  isSum: boolean
}
