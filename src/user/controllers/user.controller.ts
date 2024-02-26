import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/create-user.dto'
import { User } from '../entities/user.entity'

@ApiTags('유저')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({
    summary: '회원가입',
    description: '유저를 등록합니다.',
  })
  @ApiResponse({ status: 201, description: 'sucess' })
  @Post('/signup')
  signUp(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<object> {
    return this.userService.signUp(
      createUserDto.username,
      createUserDto.password,
      createUserDto.consultingYn,
    )
  }
}
