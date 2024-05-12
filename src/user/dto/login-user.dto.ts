import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: '이메일', example: 'wonn22@naver.com' })
  email: string

  @ApiProperty({ description: '비밀번호', example: '1q2w3e4r5t!' })
  password: string
}
