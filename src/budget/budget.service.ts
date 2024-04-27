import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { UpdateBudgetDto } from './dto/update-budget.dto'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { Budget } from './entities/budget.entity'
import { IBudgetService } from './interfaces/budget.service.interface'
import {
  Ratio,
  BudgetAmount,
  IBudgetDesignStrategy,
} from './interfaces/budget-design.interface'
import { IBUDGET_DESIGN_STRAGTEGY } from 'src/common/utils/constants'
import { BudgetRepository } from './budget.repository'
import { CategoryRepository } from './category.repository'

@Injectable()
export class BudgetService implements IBudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
    @Inject(IBUDGET_DESIGN_STRAGTEGY)
    private readonly budgetDesignStrategy: IBudgetDesignStrategy,
  ) {}

  async createBudget(
    createBudgetDto: CreateBudgetDto,
    userId: string,
  ): Promise<Budget> {
    const { category: categoryName, ...budgetDetails } = createBudgetDto

    const category = await this.categoryRepository.findOneBy({
      name: categoryName,
    })

    if (!category) {
      throw new NotFoundException(
        `카테고리 '${categoryName}'를 찾을 수 없습니다.`,
      )
    }

    const budget = this.budgetRepository.create({
      ...budgetDetails,
      category,
      user: { id: userId },
    })

    return await this.budgetRepository.save(budget)
  }

  async designBudget(
    totalAmount: number,
    year: number,
    month: number,
  ): Promise<BudgetAmount[]> {
    const ratios = await this.calculateCategoryRatios(year, month)
    return this.budgetDesignStrategy.designBudget(ratios, totalAmount)
  }

  private async calculateCategoryRatios(
    year: number,
    month: number,
  ): Promise<Ratio[]> {
    // 카테고리별 평균 amount 조회 및 전체 amount 계산
    const categoryAmounts = await this.budgetRepository
      .createQueryBuilder('budget')
      .select('category.name', 'categoryName')
      .addSelect('AVG(budget.amount)', 'averageAmount')
      .innerJoin('budget.category', 'category')
      .where('budget.year = :year AND budget.month = :month', { year, month })
      .andWhere('category.name <> :totalCategory', { totalCategory: '전체' })
      .groupBy('category.name')
      .getRawMany()

    const totalAmount = categoryAmounts.reduce(
      (total, curr) => total + parseFloat(curr.averageAmount),
      0,
    )

    // 전체 카테고리 비율 계산 (기본 비율 또는 DB에서 조회된 비율 사용)
    if (categoryAmounts.length === 0) {
      return this.getDefaultRatios()
    } else {
      return categoryAmounts.map((cat) => ({
        categoryName: cat.categoryName,
        ratio: (parseFloat(cat.averageAmount) / totalAmount).toFixed(3),
      }))
    }
  }

  private getDefaultRatios(): Ratio[] {
    return [
      { categoryName: '식사', ratio: '0.35' },
      { categoryName: '교통', ratio: '0.13' },
      { categoryName: '문화생활', ratio: '0.15' },
      { categoryName: '생활용품', ratio: '0.12' },
      { categoryName: '주거/통신', ratio: '0.25' },
    ]
  }

  async findBudgets(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Budget[]> {
    const whereCondition = {
      user: { id: userId },
      ...(year && { year }),
      ...(month && { month }),
    }

    const budgets = await this.budgetRepository.find({
      where: whereCondition,
      relations: ['category', 'user'],
    })

    if (!budgets.length) {
      throw new NotFoundException(
        `예산을 찾을 수 없습니다. User ID: '${userId}'${
          year ? `, Year: ${year}` : ''
        }${month ? `, Month: ${month}` : ''}.`,
      )
    }

    return budgets
  }

  async updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<Budget> {
    const category = await this.categoryRepository.findOneBy({
      name: updateBudgetDto.category,
    })

    if (!category) {
      throw new NotFoundException(
        `해당 카테고리${updateBudgetDto.category}를 찾을 수 없습니다.`,
      )
    }

    const updatedBudgetData = {
      ...updateBudgetDto,
      category,
      user: { id: userId },
    }

    const budget = await this.budgetRepository.findOne({
      where: { id, user: { id: userId } },
    })

    if (!budget) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }

    return await this.budgetRepository.save({ ...budget, ...updatedBudgetData })
  }

  async deleteBudget(id: number): Promise<void> {
    const result = await this.budgetRepository.delete(id)

    if (result.affected === 0) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }
  }
}
