import { requestE2E } from './request.e2e'
import { INestApplication } from '@nestjs/common'

export async function setupLoggedIn(
  app: INestApplication,
): Promise<{ accessToken: string; refreshToken: string }> {
  const loginResult = await requestE2E(app, 'post', '/auth/login', 201, null, {
    email: 'wonn22@naver.com',
    password: '1q2w3e4r5t!',
  })

  return {
    accessToken: loginResult.body.accessToken,
    refreshToken: loginResult.body.refreshToken,
  }
}
