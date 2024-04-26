import { INestApplication } from '@nestjs/common'
import { requestE2E } from './request.e2e'
import { closeNestApplication, createNestApplication } from './utils'

jest.setTimeout(30000)

describe('AuthController (e2e)', () => {
  let app: INestApplication
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    app = await createNestApplication()
  })

  afterAll(async () => {
    closeNestApplication(app)
  })

  describe('/auth/login : (POST) : 유저 로그인', () => {
    it('로그인 성공', async () => {
      const response = await requestE2E(app, 'post', '/auth/login', 201, null, {
        email: 'wonn22@naver.com',
        password: '1q2w3e4r5t!',
      })

      accessToken = response.body.accessToken
      refreshToken = response.body.refreshToken
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
    })
  })

  describe('/auth/refresh : (GET) : Access 토큰 재발급', () => {
    it('Access 토큰 재발급 성공', async () => {
      const response = await requestE2E(
        app,
        'get',
        '/auth/refresh',
        200,
        refreshToken,
      )

      expect(response.body).toHaveProperty('accessToken')
    })
  })

  describe('/auth/logout : (POST) : 로그아웃', () => {
    it('로그아웃 성공', async () => {
      const response = await requestE2E(
        app,
        'post',
        '/auth/logout',
        201,
        accessToken,
      )

      expect(response.body.message).toEqual('로그아웃 성공.')
    })
  })

  describe('/auth/protected : (GET) : 로그인 확인', () => {
    it('로그인 되어 있는 유저', async () => {
      const response = await requestE2E(
        app,
        'get',
        '/auth/protected',
        200,
        accessToken,
      )

      expect(response.text).toEqual('true')
    })
  })
})
