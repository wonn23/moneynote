import * as request from 'supertest'
import { createNestApplication } from './utils'
import * as crypto from 'crypto'

describe('UserController (e2e)', () => {
  let app

  beforeAll(async () => {
    app = await createNestApplication()
  })

  afterAll(async () => {
    await app.close()
  })
  describe('users', () => {
    it('/users/signup : (POST) : 유저 회원가입', async () => {
      const uniqueUsername = `user_${crypto.randomBytes(6).toString('hex')}`
      const response = await request(app.getHttpServer())
        .post(`/users/signup`)
        .send({
          username: uniqueUsername,
          email: `${uniqueUsername}@naver.com`,
          password: '1q2w3e4r5t!',
          consultingYn: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty(
        'message',
        '회원가입에 성공했습니다.',
      )
    })
  })
})
