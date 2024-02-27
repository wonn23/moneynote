import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Get,
  Request,
} from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { SignInDto } from '../dto/signin.dto'
import { UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('인증/인가')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: '로그인 API',
    description: '호출자 로그인 후 토큰을 응답합니다.',
  })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'InternalServerError.' })
  @Post('/signin')
  signIn(@Body(ValidationPipe) signInDto: SignInDto): Promise<object> {
    return this.authService.signIn(signInDto.username, signInDto.password)
  }

  @ApiOperation({
    summary: 'Access 토큰 재발급',
    description:
      'Access Token 만료시 Refresh Token을 확인하여 새로운 Access Token을 발급합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'InternalServerError.' })
  @UseGuards(AuthGuard('jwt-refresh-token'))
  @Get('/refresh')
  getNewAccessToken(@Request() req): Promise<{ accessToken: string }> {
    return this.authService.getNewAccessToken(req.user)
  }
}
