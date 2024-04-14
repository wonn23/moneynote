import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter'
import { initializeTransactionalContext } from 'typeorm-transactional'
import * as request from 'supertest'

export async function createNestApplication(): Promise<INestApplication> {
  initializeTransactionalContext()
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.init()
  return app
}

export async function authenticateUser(
  app: INestApplication,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'wonn22@naver.com', password: '1q2w3e4r5t!' })
    .expect(201)

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  }
}
