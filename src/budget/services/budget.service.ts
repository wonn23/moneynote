import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { DataSource, Repository } from 'typeorm'
import { Budget } from '../entities/budget.entity'
import { User } from 'src/user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from '../entities/category.entity'

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

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

  async designBudget(totalAmount: number, year: number, month: number) {
    try {
      const ratios = await this.getAverageCategoryRatios(year, month)
      if (!ratios || ratios.length === 0) {
        throw new NotFoundException(
          '해당 연도와 월의 예산 데이터가 존재하지 않습니다.',
        )
      }

      const totalCategoryRatio =
        ratios.find((ratio) => ratio.name === '전체')?.ratio || 1

      const budgetDesigns = ratios
        .filter((ratio) => ratio.name !== '전체')
        .map((ratio) => {
          const calculateAmount =
            (totalAmount * ratio.ratio) / totalCategoryRatio
          return {
            category: ratio.name,
            budget: Math.round(calculateAmount),
          }
        })

      const otherCategories = budgetDesigns.filter(
        (budget) => budget.budget <= totalAmount * 0.1,
      )

      const otherTotalBudget = otherCategories.reduce(
        (total, curr) => total + curr.budget,
        0,
      )

      const filteredBudgets = budgetDesigns.filter(
        (budget) => budget.budget > totalAmount * 0.1,
      )
      if (otherTotalBudget > 0) {
        filteredBudgets.push({ category: '기타', budget: otherTotalBudget })
      }

      return filteredBudgets
    } catch (error) {
      throw new InternalServerErrorException(
        '예산 설계 중 에러가 발생했습니다.',
      )
    }
  }

  async getAverageCategoryRatios(year: number, month: number) {
    // 해당 year과 month에 해당하는 전체 유저의 예산 평균 비율을 계산한다.
    try {
      const ratios = await this.budgetRepository
        .createQueryBuilder('budget')
        .select('category.name', 'name')
        .addSelect('AVG(budget.amount)', 'averageAmount')
        .innerJoin(Category, 'category', 'budget.category_id = category.id')
        .where('budget.year = :year AND budget.month = :month', { year, month })
        .groupBy('category.name')
        .getRawMany()

      if (ratios.length === 0) {
        return [
          { name: '식사', ratio: 0.35 },
          { name: '교통', ratio: 0.13 },
          { name: '문화생활', ratio: 0.15 },
          { name: '생활용품', ratio: 0.12 },
          { name: '주거/통신', ratio: 0.25 },
        ]
      } else {
        const totalBudget = ratios.find((ratio) => ratio.name === '전체')
          ?.averageAmount
        if (totalBudget) {
          return ratios
            .map((ratio) => {
              if (ratio.name !== '전체') {
                return {
                  name: ratio.name,
                  ratio: (
                    parseFloat(ratio.averageAmount) / parseFloat(totalBudget)
                  ).toFixed(3),
                }
              }
            })
            .filter(Boolean) // '전체' 카테고리 제외
        }
      }

      return ratios
    } catch (error) {
      throw new InternalServerErrorException(
        '예산 비율 계산 중 에러가 발생했습니다.',
      )
    }
  }

  async findBudgetByYear(year: number, user: User): Promise<Budget[]> {
    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.year = :year AND budget.user_id = :user', {
        year,
        user,
      })
      .getRawMany()

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
    user: User,
  ): Promise<Budget[]> {
    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .where(
        'budget.user_id = :user AND budget.year =:year AND budget.month = :month',
        { year, month, user },
      )
      .getRawMany()

    if (!budgets.length) {
      throw new NotFoundException(
        `해당 연도(${year})와 월(${month})의 예산 데이터를 찾을 수 없습니다.`,
      )
    }
    return budgets
  }

  async updateBudget(
    id: number,
    updateBudgetDto: UpdateBudgetDto,
    user: User,
  ): Promise<Budget> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const category = await queryRunner.manager.findOne(Category, {
        where: { name: updateBudgetDto.category },
      })

      if (!category) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      const budget = await queryRunner.manager.findOne(Budget, {
        where: { id, user: { id: user.id } },
        relations: ['category', 'user'],
      })

      if (!budget) {
        throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
      }

      budget.amount = updateBudgetDto.amount
      budget.category = category // 업데이트된 카테고리로 설정

      await queryRunner.manager.save(budget)

      await queryRunner.commitTransaction()

      return budget
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException('예산을 수정하는데 실패했습니다.')
    } finally {
      await queryRunner.release()
    }
  }

  async deleteBudget(id: number): Promise<void> {
    const result = await this.budgetRepository.delete(id)

    if (result.affected === 0) {
      throw new NotFoundException(`해당 ID(${id})의 예산을 찾을 수 없습니다.`)
    }
  }
}
