import { Injectable } from '@nestjs/common'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { ExpenseRepository } from '../repositories/expense.repository'

@Injectable()
export class ExpenseService {
  constructor(private expenseRepository: ExpenseRepository) {}
  async createExpense(createExpenseDto: CreateExpenseDto) {
    const date = new Date()

    const { content, isSum } = createExpenseDto

    const expense = {
      date,
      content,
      isSum,
    }
    return this.expenseRepository.save(expense)
  }

  async getAllExpense() {
    return `This action returns all expense`
  }

  async getOneExpense(id: number) {
    return `This action returns a #${id} expense`
  }

  async setExpense(id: number, updateExpenseDto: UpdateExpenseDto) {
    return `This action updates a #${id} expense`
  }

  async deleteExpense(id: number) {
    return `This action removes a #${id} expense`
  }
}
