import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

// 회원가입 DTO
export class CreateUserDto {
  @ApiProperty({ description: '계정' })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @MinLength(10, { message: '최소 10자리 이상 작성해야 합니다.' })
  @MaxLength(20)
  @Matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$/, {
    message: '숫자, 영어, 특수문자를 사용하여 작성해야합니다.',
  })
  password: string

  @ApiProperty({ description: '컨설팅 허용 여부' })
  @IsBoolean()
  consultingYn: boolean
}
