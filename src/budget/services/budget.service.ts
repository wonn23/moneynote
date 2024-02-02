import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetRepository } from '../repositories/budget.repository'
import { CategoryRepository } from '../repositories/category.repository'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { EntityNotFoundError } from 'typeorm'
import { Budget } from '../entities/budget.entity'
import { BudgetStatsService } from './budgetStats.service'
import { BudgetRecommendationDto } from '../dto/budget-recommendation.dto'
import { privateDecrypt } from 'crypto'
import { User } from 'src/user/entities/user.entity'

@Injectable()
export class BudgetService {
  private minimumRatio = 10
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly budgetStatsService: BudgetStatsService,
  ) {}

  // 예산 총합 구하기
  getTotalAmount(arr: number[]): number {
    let total: number = 0
    arr.forEach((price) => {
      total += price
    })
    return total
  }

  async createBudget(
    createBudgetDto: CreateBudgetDto,
    user: User,
  ): Promise<Budget> {
    try {
      const { category, ...rest } = createBudgetDto

      // category 테이블에서 body값에 맞는 category_id 찾기
      const foundCategory = await this.categoryRepository.findOne({
        where: { name: category },
      })

      if (!foundCategory) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      const budget = this.budgetRepository.create({
        ...rest,
        category: foundCategory,
        user,
      })

      return await this.budgetRepository.save(budget)
    } catch (error) {
      throw new InternalServerErrorException('예산 생산에 문제가 발생했습니다.')
    }
  }

  async designBudget(totalAmount: number): Promise<BudgetRecommendationDto> {
    const averageRatios = await this.budgetStatsService.getAverageBudgetRatios()
    let budgetRecommendations = {
      food: 0,
      transportation: 0,
      curtureLife: 0,
      housingCommunication: 0,
      dailyNeccessities: 0,
      other: 0,
    }

    for (const [category, ratio] of Object.entries(averageRatios)) {
      // ratio가 숫자인지 확인하기
      const numericRatio = typeof ratio === 'number' ? ratio : parseFloat(ratio)

      // ratio 유효성 검사
      if (isNaN(numericRatio)) {
        throw new Error(`${category}에 대한 비율이 유효하지 않습니다.`)
      }
      const amountForCategory = totalAmount * numericRatio

      if (numericRatio < 0.1) {
        budgetRecommendations.other += amountForCategory
      } else {
        if (category in budgetRecommendations) {
          budgetRecommendations[category] += amountForCategory
        } else {
          // 미리 정의된 카테고리가 아닐 경우
          budgetRecommendations.other += amountForCategory
        }
      }
    }

    return new BudgetRecommendationDto(budgetRecommendations)
  }

  // 총액 비례 비율에 맞는 금액 계산
  getPercentageTotalAmount(ratio: object[], totalPrice: number): object[] {
    /**
     * 카테고리별 예산 비율을 바탕으로 전체 예산 대비 각 카테고리의 예산을 계산하고, 10% 이하의 카테고리들을 '그외'로
     * 분류하여 그 합계를 계산합니다.
     * 'ratio' 객체 배열과 'totalPrice' 총 예산을 사용하여 각 카테고리의 비율에 따른 예산을 계산하고 객체 배열로 반환합니다.
     */
    ratio = ratio.map((obj) => ({
      ...obj,
      ratio: Number(obj['ratio']),
    }))
    const percentages = ratio.filter(
      (percentageCategory) => percentageCategory['ratio'] >= this.minimumRatio,
    )
    const etc = ratio
      .filter(
        (percentageCategory) => percentageCategory['ratio'] < this.minimumRatio,
      )
      .reduce((sum, current) => {
        return sum + current['ratio']
      }, 0)

    percentages.push({ category_name: '그외', ratio: etc })

    const percentageAmount = percentages.map((percentageCategory) => ({
      ...percentageCategory,
      amount:
        Math.floor((totalPrice * (percentageCategory['ratio'] / 100)) / 1000) *
        1000,
    }))

    return percentageAmount
  }

  async getUserAverageRatio(totalPrice: number): Promise<object[]> {
    /**
     * 서브 쿼리 생성
     * budgetRepository를 사용해서 Budget 엔티티에 대한 쿼리 빌더를 생성합니다.
     * 이 쿼리는 각 category_id별로 amount의 합계('total_amount')와 모든 예산의 합계('total')를
     * 계산하는 서브 쿼리를 생성합니다.
     * groupBy('category_id')를 통해 카테고리별로 그룹화하고 결과적으로 각 카테고리에서 지툴된 총액과 전체 지출액을 계산합니다.
     *
     * 메인 쿼리 실행
     * categoryRepository를 사용하여 Category 엔티티에 대한 쿼리를 구성합니다.
     * 이 쿼리는 카테고리의 이름과 각 카테고리별 지출 총액이 전체 지출액에서 차지하는 비율(ratio)을 선택하여 반환합니다.
     * 비율은 ROUND 함수를 사용하여 소수점 둘째 자리까지 반올림합니다.
     * 서브 쿼리의 결과(subQuery)는 innerJoin을 통해 메인 쿼리에 조인되며, 이를 통해 각 카테고리의 이름과 해당 카테고리의 지출 비율이 계산됩니다.
     *
     * 결과
     * getRawMany()를 호출하여 최종결과를 얻습니다. 이 결과는 카테고리의 이름과 해당 카테고리의 지출 비율을 포함합니다.
     */
    try {
      const subQuery = this.budgetRepository
        .createQueryBuilder()
        .subQuery()
        .select([
          'category_id',
          'SUM(amount) as total_amount',
          '(select sum(total) from budgets) as total',
        ])
        .from(Budget, 'budget')
        .groupBy('category_id')
        .getQuery()

      const result = this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.name',
          'ROUND(sub.total_amount * 100.0:: decimal/sub.total:: decimal, 2) as ratio',
        ])
        .innerJoin(subQuery, 'sub', 'sub.category_id = category.id')
        .orderBy('ratio', 'DESC')

      const ratio = await result.getRawMany()
      return this.getPercentageTotalAmount(ratio, totalPrice)
    } catch (error) {
      throw new InternalServerErrorException(
        '추천 예산을 불러오는 도중 에러가 발생했습니다.',
      )
    }
  }

  async findBudgetByYear(year: number): Promise<Budget[]> {
    const budgets = await this.budgetRepository.find({
      where: { year },
    })

    if (!budgets.length) {
      throw new NotFoundException(
        `해당 연도(${year})의 예산 데이터를 찾을 수 없습니다.`,
      )
    }

    return budgets
  }

  async findBudgetByYearAndMonth(
    year: number,
    month: number,
  ): Promise<Budget[]> {
    const budgets = await this.budgetRepository.find({
      where: { year, month },
    })

    if (budgets.length) {
      throw new NotFoundException(
        `해당 연도(${year})와 월(${month})의 예산 데이터를 찾을 수 없습니다.`,
      )
    }
    return budgets
  }

  async updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    try {
      const budget = await this.budgetRepository.findOneOrFail({
        where: { id },
      })

      Object.assign(budget, updateBudgetDto)
      await this.budgetRepository.save(budget)

      return budget
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
      }

      throw new InternalServerErrorException(
        '예산을 수정하는 데 문제가 발생했습니다.',
      )
    }
  }

  async deleteBudget(id: number): Promise<void> {
    const result = await this.budgetRepository.delete(id)

    if (result.affected === 0) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }
  }
}
