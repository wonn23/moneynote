import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { ExpenseRepository } from '../repositories/expense.repository'
import { CategoryRepository } from '../../budget/repositories/category.repository'
import { Expense } from '../entities/expense.entity'
import { User } from 'src/user/entities/user.entity'
import { UserRepository } from 'src/user/repositories/user.repository'

@Injectable()
export class ExpenseService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async createExpense(
    id: number,
    createExpenseDto: CreateExpenseDto,
    user: User,
  ): Promise<Expense> {
    try {
      const consumer = await this.userRepository.findOne({
        where: { id: user.id },
      })

      if (!consumer) {
        throw new NotFoundException('유저를 찾을 수 없습니다.')
      }

      const expenditure = this.expenseRepository.create({
        ...createExpenseDto,
        user: { id: user.id },
      })

      return this.expenseRepository.save(expenditure)
    } catch (error) {
      throw new InternalServerErrorException('지출 생성에 문제가 발생했습니다.')
    }
  }

  async getAllExpense(user: User) {
    try {
      return this.expenseRepository.find({
        order: {
          createdAt: 'DESC',
        },
      })
    } catch (error) {
      throw new InternalServerErrorException(
        '해당 지출 목록을 불러오는데 실패했습니다.',
      )
    }
  }

  async getOneExpense(id: number, user: User) {
    const expenditure = await this.expenseRepository.findOne({
      where: { id, user: { id: user.id } },
    })

    if (!expenditure) {
      throw new NotFoundException(`해당 ${id}의 지출을 찾을 수 없습니다.`)
    }
    return expenditure
  }

  async updateExpense(
    id: number,
    updateExpenseDto: UpdateExpenseDto,
    user: User,
  ) {
    const expenditure = await this.expenseRepository.findOne({
      where: { id, user: { id: user.id } },
    })
    if (expenditure.user.id !== user.id) {
      throw new UnauthorizedException('접근 권한이 없습니다.')
    }
    Object.assign(expenditure, updateExpenseDto)
    return this.expenseRepository.save(expenditure)
  }

  async deleteExpense(id: number, user: User) {
    const result = await this.expenseRepository.delete({
      id,
      user: { id: user.id },
    })
    if (result.affected === 0) {
      throw new NotFoundException('해당 지출을 찾을 수 없습니다.')
    }
  }
}
