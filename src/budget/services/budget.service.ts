import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { BudgetRepository } from '../repositories/budget.repository'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Category } from '../entities/category.entity'

@Injectable()
export class BudgetService {
  constructor(private budgetrepository: BudgetRepository) {}
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

      // foundCategory = { id : 1, name: '전체' }
      const budget = {
        yearMonth,
        amount,
        category: foundCategory,
      }

      await this.budgetrepository.save(budget)
    } catch (error) {
      throw new InternalServerErrorException('예산 생산에 문제가 발생했습니다.')
    }
  }

  findAll() {
    return `This action returns all budget`
  }

  findOne(id: number) {
    return `This action returns a #${id} budget`
  }

  update(id: number, updateBudgetDto: UpdateBudgetDto) {
    return `This action updates a #${id} budget`
  }

  remove(id: number) {
    return `This action removes a #${id} budget`
  }
}
