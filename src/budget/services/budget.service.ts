import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Repository } from 'typeorm'
import { Budget } from '../entities/budget.entity'
import { User } from 'src/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from '../entities/category.entity'
import { Transactional } from 'typeorm-transactional'
import { IBudgetService } from '../interfaces/budget.service.interface'
import {
  Ratio,
  BudgetAmount,
  IBudgetDesignStrategy,
} from '../interfaces/budget-design.interface'
import { IBUDGET_DESIGN_STRAGTEGY } from 'src/common/di.tokens'

@Injectable()
export class BudgetService implements IBudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(IBUDGET_DESIGN_STRAGTEGY)
    private readonly budgetDesignStrategy: IBudgetDesignStrategy,
  ) {}

  @Transactional()
  async createBudget(
    createBudgetDto: CreateBudgetDto,
    user: User,
  ): Promise<Budget> {
    try {
      const { category, ...rest } = createBudgetDto

      // category 테이블에서 body값에 맞는 category_id 찾기
      const categoryName = await this.categoryRepository.findOneBy({
        name: category,
      })

      if (!categoryName) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      const budget = this.budgetRepository.create()
      Object.assign(budget, rest, { category: categoryName, user })

      return await this.budgetRepository.save(budget)
    } catch (error) {
      throw new InternalServerErrorException('예산 생산에 문제가 발생했습니다.')
    }
  }

  async designBudget(
    totalAmount: number,
    year: number,
    month: number,
  ): Promise<BudgetAmount[]> {
    const ratios = await this.calculateCategoryRatios(year, month)
    return this.budgetDesignStrategy.designBudget(ratios, totalAmount)
  }

  async calculateCategoryRatios(year: number, month: number): Promise<Ratio[]> {
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

  async findBudgetByYear(year: number, user: User): Promise<Budget[]> {
    const budgets = await this.budgetRepository.find({
      where: {
        year,
        user,
      },
    })

    if (budgets.length === 0) {
      throw new NotFoundException(
        `해당 연도(${year})의 예산 데이터를 찾을 수 없습니다.`,
      )
    }

    return budgets
  }

  async findBudgetByYearAndMonth(
    year: number,
    month: number,
    user: User,
  ): Promise<Budget[]> {
    const budgets = await this.budgetRepository.find({
      where: {
        year,
        month,
        user,
      },
    })

    if (!budgets.length) {
      throw new NotFoundException(
        `해당 연도(${year})와 월(${month})의 예산 데이터를 찾을 수 없습니다.`,
      )
    }
    return budgets
  }

  @Transactional()
  async updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    user: User,
  ): Promise<Budget> {
    const budget = await this.budgetRepository.findOneBy({
      id,
      user: { id: user.id },
    })

    if (!budget) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }
    const category = await this.categoryRepository.findOneBy({
      name: updateBudgetDto.category,
    })

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.')
    }

    Object.assign(budget, updateBudgetDto, { category })

    return await this.budgetRepository.save(budget)
  }

  async deleteBudget(id: number): Promise<void> {
    const result = await this.budgetRepository.delete(id)

    if (result.affected === 0) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }
  }
}
