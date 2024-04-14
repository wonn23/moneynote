import * as request from 'supertest'
import { createNestApplication } from './utils'

describe('AuthController (e2e)', () => {
  let app
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    app = await createNestApplication()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/auth/login : (POST) : 유저 로그인', () => {
    it('로그인 성공', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wonn22@naver.com',
          password: '1q2w3e4r5t!',
        })
        .expect(201)
      accessToken = response.body.accessToken
      refreshToken = response.body.refreshToken
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
    })
  })

  describe('/auth/logout : (POST) : 로그아웃', () => {
    it('로그아웃 성공', async () => {
      await request(app.getHttpServer())
        .get('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
    })
  })

  describe('/auth/protected : (GET) : 로그인 확인', () => {
    it('로그인 되어 있는 유저', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/protected')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response).toEqual(true)
    })
  })

  describe('/auth/refresh : (GET) : Access 토큰 재발급', () => {
    it('Access 토큰 재발급 성공', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
    })
  })
})
