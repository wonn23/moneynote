import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetRepository } from '../repositories/budget.repository'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Category } from '../entities/category.entity'
import { EntityNotFoundError, Like } from 'typeorm'
import { Budget } from '../entities/budget.entity'

@Injectable()
export class BudgetService {
  constructor(private budgetRepository: BudgetRepository) {}
  async createBudget(createBudgetDto: CreateBudgetDto): Promise<void> {
    try {
      const { yearMonth, amount, category } = createBudgetDto

      // categories 테이블에서 body값에 맞는 category_id 찾기
      const foundCategory = await Category.findOne({
        where: { name: category },
      })

      if (!foundCategory) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      // 해당 연월의 카테고리 예산이 이미 있는지 확인
      const existingBudget = await this.budgetRepository.findOne({
        where: { yearMonth, category: { id: foundCategory.id } },
        relations: ['category'],
      })

      if (existingBudget && existingBudget.category.id === foundCategory.id) {
        // 이미 예산이 존재하면 수정
        existingBudget.amount = amount
        await this.budgetRepository.save(existingBudget)
      } else {
        // 예산이 존재하지 않으면 새로 생성
        const newBudget = this.budgetRepository.create({
          yearMonth,
          amount,
          category: foundCategory,
        })
        await this.budgetRepository.save(newBudget)
      }
    } catch (error) {
      throw new InternalServerErrorException('예산 생산에 문제가 발생했습니다.')
    }
  }

  async designBudget() {
    return
  }

  async findBudgetByYear(yearMonth: string): Promise<Budget[]> {
    // 'YYYY-MM'에서 YYYY만 뽑기
    const year = yearMonth.substring(0, 4)
    const budgets = await this.budgetRepository.find({
      where: { yearMonth: Like(`${year}%`) },
    })
    if (!budgets || budgets.length === 0) {
      throw new NotFoundException('해당 연도의 예산 데이터를 찾을 수 없습니다.')
    }

    return budgets
  }

  async findBudgetByYearAndMonth(yearMonth: string): Promise<Budget[]> {
    const budgets = await this.budgetRepository.find({
      where: { yearMonth },
    })

    if (!budgets || budgets.length === 0) {
      throw new NotFoundException('해당 월의 예산 데이터를 찾을 수 없습니다.')
    }
    return budgets
  }

  async setBudget(id: number, updateBudgetDto: UpdateBudgetDto) {
    try {
      const budget = await this.budgetRepository.findOneOrFail({
        where: { id },
      })

      budget.amount = updateBudgetDto.amount

      await this.budgetRepository.save(budget)
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`해당 ${id}의 예산을 찾을 수 없습니다.`)
      }
      throw new InternalServerErrorException(
        '예산을 수정하는데 문제가 있습니다.',
      )
    }
  }

  async deleteBudget(id: number) {
    await this.budgetRepository.softDelete(id)
  }
}
