import { setupLoggedIn } from './setup-logged-in'
import { closeNestApplication, createNestApplication } from './utils'
import { requestE2E } from './request.e2e'
import { INestApplication } from '@nestjs/common'

jest.setTimeout(30000)

describe('ExpenseController (e2e)', () => {
  let app: INestApplication
  let createdExpenseId: number
  let accessToken: string

  beforeAll(async () => {
    app = await createNestApplication()
    const tokens = await setupLoggedIn(app)
    accessToken = tokens.accessToken
  })

  afterAll(async () => {
    await closeNestApplication(app)
  })

  describe('/expense : (POST) : 지출 생성', () => {
    it('지출 생성 성공', async () => {
      const response = await requestE2E(
        app,
        'post',
        '/expense',
        201,
        accessToken,
        {
          amount: 5000,
          memo: '짜장면',
          isExcluded: false,
          category: '식사',
        },
      )

      createdExpenseId = response.body.id

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
  })

  describe('/expense : (GET) : 지출 목록 조회', () => {
    it('지출 목록 조회 성공', async () => {
      const startDate = '2024-04-01'
      const endDate = '2024-04-30'
      const response = await requestE2E(
        app,
        'get',
        `/expense?startDate=${startDate}&endDate=${endDate}`,
        200,
        accessToken,
      )

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
  })

  describe('/expense/:id : (GET) : 지출 상세 조회', () => {
    it('지출 상세 조회', async () => {
      const id = 1
      const response = await requestE2E(
        app,
        'get',
        `/expense/${id}`,
        200,
        accessToken,
      )

      expect(response.body).toHaveProperty('amount')
      expect(response.body).toHaveProperty('memo')
      expect(response.body).toHaveProperty('spentDate')
      expect(response.body).toHaveProperty('isExcluded')
      expect(response.body).toHaveProperty('category')
    })
  })

  describe('/expense/:id : (PUT) : 지출 수정', () => {
    it('지출 수정 성공', async () => {
      const id = 1
      const response = await requestE2E(
        app,
        'put',
        `/expense/${id}`,
        200,
        accessToken,
        {
          amount: 7000,
          memo: '오늘은 영화 감상',
          isExcluded: false,
          category: '문화생활',
        },
      )

      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('amount', 7000)
      expect(response.body).toHaveProperty('memo')
      expect(response.body).toHaveProperty('spentDate')
      expect(response.body).toHaveProperty('isExcluded')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('deletedAt')
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('name', '문화생활')
    })
  })

  describe('/expense/:id : (DELETE) : 지출 삭제', () => {
    it('지출 삭제 성공', async () => {
      await requestE2E(
        app,
        'delete',
        `/expense/${createdExpenseId}`,
        200,
        accessToken,
      )
    })
  })

  describe('/expense/alarm/recommend : (GET) : 오늘의 지출 추천', () => {
    it('오늘의 지출 추천 성공', async () => {
      const response = await requestE2E(
        app,
        'get',
        `/expense/alarm/recommend`,
        200,
        accessToken,
      )

      expect(response.body).toHaveProperty('availableDailyExpense')
      expect(response.body).toHaveProperty(
        'filteredTodayRecommendedExpenseByCategory',
      )
      expect(
        Array.isArray(response.body.filteredTodayRecommendedExpenseByCategory),
      ).toBeTruthy()
      expect(response.body).toHaveProperty('message')
      expect(typeof response.body.message).toBe('string')

      response.body.filteredTodayRecommendedExpenseByCategory.forEach(
        (item) => {
          expect(typeof item.categoryId).toEqual('number')
          expect(typeof item.categoryName).toEqual('string')
          expect(item).toHaveProperty('todaysRecommendedExpenseAmount')
          expect(typeof item.todaysRecommendedExpenseAmount).toEqual('number')
        },
      )
    })
  })

  describe('/expense/alarm/guide : (GET) : 오늘의 지출 안내', () => {
    it('오늘의 지출 안내 성공', async () => {
      const response = await requestE2E(
        app,
        'get',
        `/expense/alarm/guide`,
        200,
        accessToken,
      )

      expect(Array.isArray(response.body)).toBeTruthy()
      response.body.forEach((item) => {
        expect(item).toHaveProperty('categoryName')
        expect(item).toHaveProperty('ratio')
      })
    })
  })

  describe('/expense/statistics/monthly : (GET) : 지난달과 소비율 비교', () => {
    it('지난달과 소비율 비교 성공', async () => {
      const response = await requestE2E(
        app,
        'get',
        `/expense/statistics/monthly`,
        200,
        accessToken,
      )

      expect(Array.isArray(response.body)).toBeTruthy()
      response.body.forEach((item) => {
        expect(item).toHaveProperty('categoryId')
        expect(item).toHaveProperty('lastMonthAmount')
        expect(item).toHaveProperty('thisMonthAmount')
        expect(item).toHaveProperty('ratio')
      })
    })
  })

  describe('/expense/statistics/weekly : (GET) : 지난주와 소비율 비교', () => {
    it('지난주와 소비율 비교 성공', async () => {
      const response = await requestE2E(
        app,
        'get',
        `/expense/statistics/weekly`,
        200,
        accessToken,
      )

      expect(Array.isArray(response.body)).toBeTruthy()
      response.body.forEach((item) => {
        expect(item).toHaveProperty('categoryId')
        expect(item).toHaveProperty('lastWeekAmount')
        expect(item).toHaveProperty('thisWeekAmount')
        expect(item).toHaveProperty('ratio')
      })
    })
  })
})
