import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

export const requestE2E = async (
  app: INestApplication,
  method: string,
  path: string,
  status: number,
  token?: string,
  body?: object,
): Promise<request.Response> => {
  return await request(app.getHttpServer())
    [method](path)
    .set('Authorization', `Bearer ${token}`)
    .send(body)
    .expect(status)
}
