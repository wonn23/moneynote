import { setupLoggedIn } from './setup-logged-in'
import { closeNestApplication, createNestApplication } from './utils'
import { requestE2E } from './request.e2e'

describe('BudgetController (e2e)', () => {
  let app
  let createdBudgetId: string
  let accessToken: string

  beforeAll(async () => {
    app = await createNestApplication()
    const tokens = await setupLoggedIn(app)
    accessToken = tokens.accessToken
  })

  afterAll(async () => {
    await closeNestApplication(app)
  })

  describe('/budgets : (POST) : 예산 생성', () => {
    it('예산 생성 성공', async () => {
      const response = await requestE2E(
        app,
        'post',
        '/budgets',
        201,
        accessToken,
        {
          year: 2024,
          month: 5,
          amount: 1000000,
          category: '전체',
        },
      )

      createdBudgetId = response.body.id

      expect(response.body).toHaveProperty('year', 2024)
      expect(response.body).toHaveProperty('month', 5)
      expect(response.body).toHaveProperty('amount', 1000000)
      expect(response.body).toHaveProperty('category')
      expect(response.body.category).toHaveProperty('id', 1)
      expect(response.body.category).toHaveProperty('name', '전체')
      expect(response.body).toHaveProperty('user')
    })
  })

  describe('/budgets/design : (POST) : 예산 추천 설계', () => {
    it('예산 추천 설계 성공', async () => {
      const response = await requestE2E(
        app,
        'post',
        '/budgets/design',
        201,
        accessToken,
        {
          totalAmount: 1000000,
          year: 2024,
          month: 3,
        },
      )

      const expectedCategories = [
        '식사',
        '교통',
        '문화생활',
        '생활용품',
        '주거/통신',
      ]

      response.body.forEach((item) => {
        expect(expectedCategories).toContain(item.categoryName)
        expect(typeof item.budgetAmount).toBe('number')
      })
    })
  })

  describe('/budgets/ : (GET) : 연도별 예산 조회', () => {
    it('연도별 예산 조회', async () => {
      const year = 2024
      const response = await requestE2E(
        app,
        'get',
        `/budgets/?year=${year}`,
        200,
        accessToken,
      )

      expect(Array.isArray(response.body)).toBeTruthy()
      response.body.forEach((item) => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('year', year)
        expect(item).toHaveProperty('month')
        expect(item).toHaveProperty('amount')
        expect(item).toHaveProperty('createdAt')
        expect(item).toHaveProperty('updatedAt')
        expect(item).toHaveProperty('deletedAt')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('user')
      })
    })

    it('연도와 월별별 예산 조회 성공', async () => {
      const year = 2024
      const month = 4
      const response = await requestE2E(
        app,
        'get',
        `/budgets/?year=${year}&month=${month}`,
        200,
        accessToken,
      )

      expect(Array.isArray(response.body)).toBeTruthy()

      response.body.forEach((item) => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('year', year)
        expect(item).toHaveProperty('month')
        expect(item).toHaveProperty('amount')
        expect(item).toHaveProperty('createdAt')
        expect(item).toHaveProperty('updatedAt')
        expect(item).toHaveProperty('deletedAt')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('user')
      })
    })
  })

  describe('/budgets/:id : (PUT) : 예산 수정', () => {
    it('예산 수정 성공', async () => {
      const id = 5
      const response = await requestE2E(
        app,
        'put',
        `/budgets/${id}`,
        200,
        accessToken,
        {
          amount: 3000000,
          category: '전체',
        },
      )

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
  })

  describe('/budgets/:id : (DELETE) : 예산 삭제', () => {
    it('예산 삭제 성공', async () => {
      await requestE2E(
        app,
        'delete',
        `/budgets/${createdBudgetId}`,
        200,
        accessToken,
      )
    })
  })
})
