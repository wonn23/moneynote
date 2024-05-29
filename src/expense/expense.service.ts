import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { Expense } from './entities/expense.entity'
import { Between } from 'typeorm'
import { Category } from 'src/budget/entities/category.entity'
import { User } from 'src/user/entities/user.entity'
import { IExpenseSerivce } from './interfaces/expense.service.interface'
import {
  ExpenseAmount,
  RecommendedExpense,
} from './interfaces/expense-recommend.interface'
import {
  IBUDGET_SERVICE,
  IEXPENSE_CALCULATION_SERVICE,
  IEXPENSE_MESSAGE_SERVICE,
} from 'src/common/utils/constants'
import { IExpenseCalculationService } from './interfaces/expense.calculation.service.interface'
import { IExpenseMessageService } from './interfaces/expense.message.service.interface'
import { IBudgetService } from 'src/budget/interfaces/budget.service.interface'
import {
  ExpenseCompatisonResult,
  GuideExpense,
} from './interfaces/expense-guide.interface'
import { UserRepository } from 'src/user/user.repository'
import { ExpenseRepository } from './expense.repository'
import { CategoryRepository } from 'src/budget/category.repository'

@Injectable()
export class ExpenseService implements IExpenseSerivce {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly categoryRepository: CategoryRepository,
    @Inject(IEXPENSE_CALCULATION_SERVICE)
    private expenseCalculationService: IExpenseCalculationService,
    @Inject(IEXPENSE_MESSAGE_SERVICE)
    private expenseMessageService: IExpenseMessageService,
    @Inject(IBUDGET_SERVICE)
    private budgetservice: IBudgetService,
  ) {}

  async createExpense(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const { category: categoryName, ...expenseDetails } = createExpenseDto

    const spentDate = new Date()
    await this.validateUserExists(userId)
    const category = await this.validateCategoryNameExists(categoryName)

    const expense = this.expenseRepository.create({
      ...expenseDetails,
      spentDate,
      category,
      user: { id: userId },
    })

    return await this.expenseRepository.save(expense)
  }

  private async validateUserExists(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId })
    if (!user) {
      throw new NotFoundException(`유저 ${userId}를 찾을 수 없습니다.`)
    }
    return user
  }

  private async validateCategoryNameExists(
    categoryName: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({
      name: categoryName,
    })
    if (!category) {
      throw new NotFoundException(
        `카테고리 '${categoryName}'를 찾을 수 없습니다.`,
      )
    }
    return category
  }

  async getAllExpense(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: {
        user: { id: userId },
        spentDate: Between(startDate, endDate),
      },
      relations: ['category', 'user'],
    })
  }

  async getOneExpense(expenseId: number, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: {
        id: expenseId,
        user: { id: userId },
      },
      relations: ['category'],
    })

    if (!expense) {
      throw new NotFoundException(
        `해당 ${expenseId}의 지출을 찾을 수 없습니다.`,
      )
    }
    return expense
  }

  async updateExpense(
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    await this.validateUserExists(userId)
    const category = await this.validateCategoryNameExists(
      updateExpenseDto.category,
    )

    const updatedExpenseData = {
      ...updateExpenseDto,
      category: category,
      user: { id: userId },
    }

    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId, user: { id: userId } },
      relations: ['category'],
    })

    if (!expense) {
      throw new NotFoundException(
        `지출 데이터 ${expenseId}를 찾을 수 없습니다.`,
      )
    }

    return this.expenseRepository.save({
      ...expense,
      ...updatedExpenseData,
    })
  }

  async deleteExpense(expenseId: number, userId: string) {
    const result = await this.expenseRepository.delete({
      id: expenseId,
      user: { id: userId },
    })
    if (result.affected === 0) {
      throw new NotFoundException(`해당 지출 ${expenseId}을 찾을 수 없습니다.`)
    }
  }

  async recommendExpense(userId: string): Promise<RecommendedExpense> {
    await this.validateUserExists(userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const firstOfTheMonth = new Date(year, month - 1, 1)
    const lastOfTheMonth = new Date(year, month)
    // 해당 카테고리의 예산 찾기
    const budgets = await this.budgetservice.findBudgets(userId, year, month)

    // 1일부터 오늘까지 사용한 지출액
    const expenses = await this.getExpensesForPeriod(
      userId,
      firstOfTheMonth,
      lastOfTheMonth,
    )

    const todayRecommendedExpenseByCategory =
      this.expenseCalculationService.calculateRecommendedExpenses(
        budgets,
        expenses,
        today,
        1000,
      )

    // 하루에 사용할 수 있는 전체 예산
    const dailyBudgetAllowance =
      todayRecommendedExpenseByCategory.find(
        (item) => item.categoryName === '전체',
      )?.todaysRecommendedExpenseAmount ?? 0

    // categoryName이 '전체'인 프로퍼티는 제외
    const filteredTodayRecommendedExpenseByCategory =
      todayRecommendedExpenseByCategory.filter(
        (item) => item.categoryName !== '전체',
      )
    // 오늘 추천 추천 지출 총 금액
    const availableDailyExpense =
      filteredTodayRecommendedExpenseByCategory.reduce(
        (total, cur) => total + cur.todaysRecommendedExpenseAmount,
        0,
      )

    const message = this.expenseMessageService.getRecommendationMessage(
      availableDailyExpense,
      dailyBudgetAllowance,
    )

    return {
      availableDailyExpense,
      filteredTodayRecommendedExpenseByCategory,
      message,
    }
  }

  private async getExpensesForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExpenseAmount[]> {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.spent_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('expense.category_id')
      .getRawMany()

    return expenses
  }

  async guideExpense(userId: string): Promise<GuideExpense[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 오늘 기준 사용했으면 적절했을 금액
    const recommendedExpenses = await this.recommendExpense(userId)

    // 오늘 기준 사용한 금액
    const actualExpenses = await this.getExpensesForPeriod(
      userId,
      today,
      tomorrow,
    )

    const expenseRatios = this.expenseCalculationService.calculateExpenseRatios(
      recommendedExpenses.filteredTodayRecommendedExpenseByCategory,
      actualExpenses,
    )

    return expenseRatios
  }

  async compareRatioToLastMonth(
    userId: string,
  ): Promise<ExpenseCompatisonResult[]> {
    const today = new Date()
    const thisMonthExpenses = await this.getExpensesForPeriod(
      userId,
      this.getStartOfMonth(today),
      today,
    )

    const lastMonthExpenses = await this.getExpensesForPeriod(
      userId,
      this.getStartOfLastMonth(today),
      this.getEndOfLastMonth(today),
    )
    return this.calculateComparisonResults(thisMonthExpenses, lastMonthExpenses)
  }

  private getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  private getStartOfLastMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1)
  }

  private getEndOfLastMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 0)
  }

  private calculateComparisonResults(
    thisMonthExpenses: ExpenseAmount[],
    lastMonthExpenses: ExpenseAmount[],
  ): ExpenseCompatisonResult[] {
    return thisMonthExpenses.map((expense) => {
      const lastMonthExpense = lastMonthExpenses.find(
        (lastMonth) => lastMonth.categoryId === expense.categoryId,
      ) || { amount: '0' }
      const ratio =
        (parseFloat(expense.amount) / parseFloat(lastMonthExpense.amount)) *
          100 || 0
      return {
        categoryId: expense.categoryId,
        lastMonthAmount: parseFloat(lastMonthExpense.amount),
        thisMonthAmount: parseFloat(expense.amount),
        ratio: `${ratio.toFixed(2)}%`,
      }
    })
  }

  async compareRatioToLastWeek(userId: string) {
    const today = new Date()
    const startOfThisWeek = this.getStartOfWeek(today)
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

    const endOfLastWeek = new Date(startOfThisWeek)
    const startOfNextWeek = new Date(startOfThisWeek)
    startOfNextWeek.setDate(startOfThisWeek.getDate() + 7)

    const lastWeekExpenditures = await this.getExpensesForPeriod(
      userId,
      startOfLastWeek,
      endOfLastWeek,
    )

    const thisWeekExpenditures = await this.getExpensesForPeriod(
      userId,
      startOfThisWeek,
      startOfNextWeek,
    )

    return this.calculateExpenditureRaitos(
      lastWeekExpenditures,
      thisWeekExpenditures,
    )
  }

  private calculateExpenditureRaitos(
    lastWeekExpenditures: ExpenseAmount[],
    thisWeekExpenditures: ExpenseAmount[],
  ) {
    return lastWeekExpenditures.map((lastWeek) => {
      const thisWeek = thisWeekExpenditures.find(
        (item) => item.categoryId === lastWeek.categoryId,
      )
      const lastWeekAmount = parseFloat(lastWeek.amount)
      const thisWeekAmount = thisWeek ? parseFloat(thisWeek.amount) : 0
      const ratio =
        thisWeekAmount > 0 ? (thisWeekAmount / lastWeekAmount) * 100 : 0
      return {
        categoryId: lastWeek.categoryId,
        lastWeekAmount,
        thisWeekAmount,
        ratio: ratio.toFixed(2) + '%',
      }
    })
  }

  // 현재 주의 시작을 계산하는 메서드
  private getStartOfWeek(date: Date) {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(date.setDate(diff))
  }
}
