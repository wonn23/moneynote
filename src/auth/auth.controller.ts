import { Controller, Post, Get, Req, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UseGuards } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../common/decorator/current-user.decorator'
import { JwtAccessAuthGuard } from './guard/jwt-access.guard'
import { LocalAuthGuard } from './guard/local.guard'
import { JwtRefreshAuthGuard } from './guard/jwt-refresh.guard'
import { User } from 'src/user/entities/user.entity'
import { GoogleAuthGuard } from './guard/google.guard'
import { Response } from 'express'
import { LoginDto } from 'src/user/dto/login-user.dto'

@ApiTags('인증/인가')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: '로그인',
    description:
      'Access Token과 Refresh Token 발급합니다. 테스트 시, Authorize의 access token에 입력해주세요.',
  })
  @ApiCreatedResponse({ description: '로그인 성공' })
  @ApiBadRequestResponse({ description: '로그인 실패' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @ApiBody({ type: LoginDto })
  @ApiBearerAuth('access-token')
  async logIn(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.logIn(user)
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
    })
    res.send({ user, accessToken, refreshToken })
  }

  @Post('/logout')
  @UseGuards(JwtAccessAuthGuard)
  @ApiOperation({
    summary: '로그아웃',
    description: 'Refresh Token을 null 처리',
  })
  @ApiOkResponse({ description: '로그아웃 성공.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('access-token')
  async logOut(@CurrentUser() userId: string): Promise<{ message: string }> {
    await this.authService.logOut(userId)
    return { message: '로그아웃 성공.' }
  }

  @Get('/protected')
  @UseGuards(JwtAccessAuthGuard)
  @ApiOperation({
    summary: '로그인 상태 확인',
    description: '인증된 사용자인지 확인합니다.',
  })
  @ApiOkResponse({ description: '인증된 사용자입니다.' })
  @ApiBearerAuth('access-token')
  async isLoggedIn(@CurrentUser() userId: string): Promise<boolean> {
    return userId ? true : false
  }

  @Get('/google/login')
  @ApiOperation({
    summary: '구글 로그인',
    description: '구글 로그인을 통해 사용자를 인증합니다.',
  })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    console.log(req)
  }

  @Get('/google/callback')
  @ApiOperation({
    summary: '구글 로그인 콜백',
    description: '구글 로그인 후 처리를 담당합니다.',
  })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@CurrentUser() user: User): Promise<User> {
    return user
  }

  @Post('/refresh')
  @ApiOperation({
    summary: 'Access 토큰 재발급',
    description:
      'Access Token 만료시 Refresh Token을 확인하여 새로운 Access Token을 발급합니다. 테스트 시 Authorize에 refresh token에 입력해주세요.',
  })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'InternalServerError.' })
  @ApiBearerAuth('refresh-token')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshAccessToken(
    @CurrentUser() userId: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(userId)
  }
}
