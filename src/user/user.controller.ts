import { Controller, Post, Body, Put, Delete, Param } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { CreateUser } from './interface/user.interface'
import { UpdateUserDto } from './dto/update-user.dto'

@ApiTags('유저')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/signup')
  @ApiOperation({
    summary: '회원가입',
    description: '유저를 등록합니다.',
  })
  @ApiCreatedResponse({ description: '회원가입 되었습니다.' })
  async register(@Body() createUserDto: CreateUserDto): Promise<CreateUser> {
    return this.userService.register(createUserDto)
  }

  @Put('/:userId')
  @ApiOperation({
    summary: '유저 정보 수정',
    description: '유저 정보를 수정합니다.',
  })
  @ApiOkResponse({ description: '유저 정보가 수정이 되었습니다.' })
  @ApiBearerAuth('access-token')
  update(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void> {
    return this.userService.update(userId, updateUserDto)
  }

  @Delete('/:userId')
  @ApiOperation({
    summary: '유저 정보 삭제',
    description: '유저 정보를 삭제합니다.',
  })
  @ApiOkResponse({ description: '유저 정보가 삭제되었습니다.' })
  @ApiBearerAuth('access-token')
  delete(@Param('userId') userId: string): Promise<void> {
    return this.userService.delete(userId)
  }
}
