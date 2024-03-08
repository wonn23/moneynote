import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from './../src/app.module'
import { HttpExceptionFilter } from 'src/common/exceptions/http-exception.filter'
import * as crypto from 'crypto'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let accessToken: string
  let refreshToken: string
  let createdBudgetId: number // 생성된 예산의 ID를 저장할 변수
  let createdExpenseId: number // 생성된 지출의 ID를 저장할 변수

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        skipMissingProperties: true,
      }),
    )
    app.useGlobalFilters(new HttpExceptionFilter())

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('auth', () => {
    it('/auth/signin : (POST) : 유저 로그인', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          username: 'test1',
          password: '1q2w3e4r5t!',
        })
        .expect(201)
      accessToken = loginResponse.body.accessToken // accessToken을 위의 변수에 저장
      refreshToken = loginResponse.body.refreshToken // refreshToken을 위의 변수에 저장
      expect(loginResponse.body).toHaveProperty('accessToken')
      expect(loginResponse.body).toHaveProperty('refreshToken')
    })

    it('/auth/refresh : (GET) : Access 토큰 재발급', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`) // 헤더에 accessToken 추가
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
    })
  })

  describe('budget', () => {
    it('/budgets : (POST) : 예산 설정 추가', async () => {
      const response = await request(app.getHttpServer())
        .post('/budgets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: 2024,
          month: 3,
          amount: 1000000,
          category: '전체',
        })
        .expect(201)

      createdBudgetId = response.body.id // 생성된 예산의 ID 저장

      expect(response.body).toHaveProperty('year', 2024)
      expect(response.body).toHaveProperty('month', 3)
      expect(response.body).toHaveProperty('amount', 1000000)
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('name', '전체')
      expect(response.body).toHaveProperty('user')
    })
    it('/budgets/design : (POST) : 예산 추천 설계', async () => {
      const response = await request(app.getHttpServer())
        .post('/budgets/design')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)

      const expectedCategories = [
        '식사',
        '교통',
        '문화생활',
        '생활용품',
        '주거/통신',
      ]
      response.body.forEach((item) => {
        expect(expectedCategories).toContain(item.category)
        expect(typeof item.budget).toBe('number')
      })
    })
    it('/budgets/year/:year : (GET) : 연도별 예산 조회', async () => {
      const year = 2024
      const response = await request(app.getHttpServer())
        .get(`/budgets/year/${year}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
      expect(Array.isArray(response.body)).toBeTruthy()

      response.body.forEach((item) => {
        expect(item).toHaveProperty('budget_id')
        expect(item).toHaveProperty('budget_year', year)
        expect(item).toHaveProperty('budget_month')
        expect(item).toHaveProperty('budget_amount')
        expect(item).toHaveProperty('budget_created_at')
        expect(item).toHaveProperty('budget_updated_at')
        expect(item).toHaveProperty('budget_deleted_at')
        expect(item).toHaveProperty('budget_category_id')
        expect(item).toHaveProperty('budget_user_id')
      })
    })
    it('/budgets/year/:year/month/:month : (GET) : 연도와 월별 예산 조회', async () => {
      const year = 2024
      const month = 3
      const response = await request(app.getHttpServer())
        .get(`/budgets/year/${year}/month/${month}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
      expect(Array.isArray(response.body)).toBeTruthy()

      response.body.forEach((item) => {
        expect(item).toHaveProperty('budget_id')
        expect(item).toHaveProperty('budget_year', year)
        expect(item).toHaveProperty('budget_month', month)
        expect(item).toHaveProperty('budget_amount')
        expect(item).toHaveProperty('budget_created_at')
        expect(item).toHaveProperty('budget_updated_at')
        expect(item).toHaveProperty('budget_deleted_at')
        expect(item).toHaveProperty('budget_category_id')
        expect(item).toHaveProperty('budget_user_id')
      })
    })
    it('/budgets/:id : (PUT) : 예산 수정', async () => {
      const id = 5
      const response = await request(app.getHttpServer())
        .put(`/budgets/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 3000000,
          category: '전체',
        })
        .expect(200)

      expect(response.body).toHaveProperty('id', 5)
      expect(response.body).toHaveProperty('year')
      expect(response.body).toHaveProperty('month')
      expect(response.body).toHaveProperty('amount', 3000000)
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('deletedAt')
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('name', '전체')
      expect(response.body).toHaveProperty('user')
    })
    it('/budgets/:id : (DELETE) : 예산 삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${createdBudgetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
  })

  describe('expense', () => {
    it('/expense : (POST) : 지출 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/expense')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 5000,
          memo: '짜장면',
          isExcluded: false,
          category: '식사',
        })
        .expect(201)

      createdExpenseId = response.body.id // 생성된 지출의 ID 저장

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('amount', 5000)
      expect(response.body).toHaveProperty('memo', '짜장면')
      expect(response.body).toHaveProperty('isExcluded', false)
      expect(response.body.category).toHaveProperty('name', '식사')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('deletedAt')
    })
    it('/expense : (GET) : 지출 목록 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/expense')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(Array.isArray(response.body)).toBeTruthy()
      response.body.forEach((item) => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('amount')
        expect(item).toHaveProperty('memo')
        expect(item).toHaveProperty('spentDate')
        expect(item).toHaveProperty('isExcluded')
        expect(item).toHaveProperty('createdAt')
        expect(item).toHaveProperty('updatedAt')
        expect(item).toHaveProperty('deletedAt')
      })
    })
    it('/expense/:id : (GET) : 지출 상세 조회', async () => {
      const id = 5
      const response = await request(app.getHttpServer())
        .get(`/expense/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('amount')
      expect(response.body).toHaveProperty('memo')
      expect(response.body).toHaveProperty('spentDate')
      expect(response.body).toHaveProperty('isExcluded')
      expect(response.body).toHaveProperty('categoryId')
    })
    it('/expense/:id : (PUT) : 지출 수정', async () => {
      const id = 5
      const response = await request(app.getHttpServer())
        .put(`/expense/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 7000,
          memo: '저녁 식사',
          isExcluded: false,
          category: '식사',
        })
        .expect(200)

      expect(response.body).toHaveProperty('id', 5)
      expect(response.body).toHaveProperty('amount', 7000)
      expect(response.body).toHaveProperty('memo')
      expect(response.body).toHaveProperty('spentDate')
      expect(response.body).toHaveProperty('isExcluded')
      expect(response.body).toHaveProperty('isExcluded')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('deletedAt')
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('name', '식사')
    })
    it('/expense/:id : (DELETE) : 지출 삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/expense/${createdExpenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
    it('/expense/alarm/recommend : (GET) : 오늘의 지출 추천', async () => {
      const response = await request(app.getHttpServer())
        .get(`/expense/alarm/recommend`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
    it('/expense/alarm/guide : (GET) : 오늘의 지출 안내', async () => {
      const response = await request(app.getHttpServer())
        .get(`/expense/alarm/guide`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
    it('/expense/statistics/monthly : (GET) : 지난달과 소비율 비교', async () => {
      const response = await request(app.getHttpServer())
        .get(`/expense/statistics/monthly`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
    it('/expense/statistics/weekly : (GET) : 지난주와 소비율 비교', async () => {
      const response = await request(app.getHttpServer())
        .get(`/expense/statistics/weekly`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
    })
  })

  describe('users', () => {
    it('/users/signup : (POST) : 유저 회원가입', async () => {
      const uniqueUsername = `user_${crypto.randomBytes(6).toString('hex')}`
      const response = await request(app.getHttpServer())
        .post(`/users/signup`)
        .send({
          username: uniqueUsername,
          password: '1q2w3e4r5t!',
          consultingYn: true,
        })
        .expect(201)

      expect(response.body).toHaveProperty('message', '회원가입에 성공했습니다')
    })
  })
})
