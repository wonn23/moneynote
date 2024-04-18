import { closeNestApplication, createNestApplication } from './utils'
import * as crypto from 'crypto'
import { requestE2E } from './request.e2e'
import { INestApplication } from '@nestjs/common'

describe('UserController (e2e)', () => {
  let app: INestApplication
  // let createdUserId: string

  beforeAll(async () => {
    app = await createNestApplication()
  })

  afterAll(async () => {
    await closeNestApplication(app)
  })

  describe('/users/signup : (POST) : 유저 회원가입', () => {
    it('유저 회원가입 성공', async () => {
      const uniqueUsername = `user_${crypto.randomBytes(6).toString('hex')}`
      const response = await requestE2E(
        app,
        'post',
        `/users/signup`,
        201,
        null,
        {
          username: uniqueUsername,
          email: `${uniqueUsername}@naver.com`,
          password: '1q2w3e4r5t!',
          consultingYn: true,
        },
      )

      expect(response.body).toHaveProperty(
        'message',
        '회원가입에 성공했습니다.',
      )

      // createdUserId = response.body.id
    })
  })

  // describe('/users/:userId : (PUT) : 유저 정보 수정', () => {
  //   it('유저 정보 수정 성공', async () => {
  //     const response = await request(app.getHttpServer())
  //       .put(`/users/${createdUserId}`)
  //       .send({
  //         username: `updated_${createdUserId}`,
  //         password: 'newpassword123!',
  //         consultingYn: false,
  //       })
  //       .expect(200) // 상태 코드만 확인

  //     // 응답 본문 확인 생략(반환 타입 void)
  //   })
  // })

  // describe('/users/:userId : (DELETE) : 유저 정보 삭제', () => {
  //   it('유저 정보 삭제 성공', async () => {
  //     await request(app.getHttpServer())
  //       .delete(`/users/${createdUserId}`)
  //       .expect(200) // 상태 코드만 확인

  //     // 응답 본문 확인 생략(반환 타입 void)
  //   })
  // })
})
