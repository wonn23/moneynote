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

@Injectable()
export class BudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly budgetStatsService: BudgetStatsService,
  ) {}

  async createBudget(createBudgetDto: CreateBudgetDto): Promise<Budget> {
    try {
      const { category, ...rest } = createBudgetDto

      // categories 테이블에서 body값에 맞는 category_id 찾기
      const foundCategory = await this.categoryRepository.findOne({
        where: { name: category },
      })

      if (!foundCategory) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      const budget = this.budgetRepository.create({
        ...rest,
        category: foundCategory,
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
