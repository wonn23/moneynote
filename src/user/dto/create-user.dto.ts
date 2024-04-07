import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

// 회원가입 DTO
export class CreateUserDto {
  @ApiProperty({ description: '이름' })
  @IsString()
  @MaxLength(20)
  username: string

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @MinLength(10, { message: '최소 10자리 이상 작성해야 합니다.' })
  @MaxLength(20)
  @Matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$/, {
    message: '숫자, 영어, 특수문자를 사용하여 작성해야합니다.',
  })
  password: string

  @ApiProperty({ description: '알림 수신 동의' })
  @IsBoolean()
  consultingYn: boolean
}
