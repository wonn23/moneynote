import { IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SignInDto {
  @ApiProperty({ example: 'UserID', description: '유저 ID', required: true })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string
  @ApiProperty({
    example: 'UserPW',
    description: '유저 Password',
    required: true,
  })
  @MinLength(10, { message: '최소 10자리 이상 작성해야 합니다.' })
  @MaxLength(20)
  @Matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$/, {
    message: '숫자, 영어, 특수문자를 사용하여 작성해야합니다.',
  })
  @IsString()
  password: string
}
