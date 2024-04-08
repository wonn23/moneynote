import { Controller, Post, Get } from '@nestjs/common'
import { AuthService } from '../services/auth.service'
import { UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../decorator/current-user.decorator'
import { JwtAccessAuthGuard } from '../guard/jwt-access.guard'
import { LocalAuthGuard } from '../guard/local.guard'
import { JwtRefreshAuthGuard } from '../guard/jwt-refresh.guard'
import { TokenResponse } from '../interfaces/token-response.interface'
import { User } from 'src/user/entities/user.entity'

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: '로그인',
    description: 'Access Token, Refresh Token 발급',
  })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'InternalServerError.' })
  login(@CurrentUser() user: User): Promise<TokenResponse> {
    return this.authService.logIn(user)
  }

  @Post('/logout')
  @UseGuards(JwtAccessAuthGuard)
  @ApiOperation({
    summary: '로그아웃',
    description: 'Refresh Token을 null 처리',
  })
  @ApiOkResponse({ description: '로그아웃 성공.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  isLoggedIn(@CurrentUser() userId: string): boolean {
    return userId ? true : false
  }

  // @Get('/google')
  // @ApiOperation({
  //   summary: '구글 로그인',
  //   description: '구글 로그인을 통해 사용자를 인증합니다.',
  // })
  // @ApiResponse({ status: 200, description: 'success' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @UseGuards(AuthGuard('google'))
  // async googleAuth(@Request() req) {}

  // @ApiOperation({
  //   summary: '구글 로그인 콜백',
  //   description: '구글 로그인 후 처리를 담당합니다.',
  // })
  // @Get('/google/redirect')
  // @UseGuards(AuthGuard('google'))
  // async googleAuthRedirect(@Request() req) {
  //   // 사용자 정보를 받아와서 추가 처리를 수행합니다.
  //   // 예를 들어, 사용자 토큰 생성 및 리다이렉트 처리 등
  //   return this.authService.googleLogin(req)
  // }

  @Get('/refresh')
  @ApiOperation({
    summary: 'Access 토큰 재발급',
    description:
      'Access Token 만료시 Refresh Token을 확인하여 새로운 Access Token을 발급합니다.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'InternalServerError.' })
  @UseGuards(JwtRefreshAuthGuard)
  refreshAccessToken(
    @CurrentUser() userId: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(userId)
  }
}
