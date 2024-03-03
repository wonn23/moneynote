import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { Expense } from '../entities/expense.entity'
import { UserRepository } from 'src/user/repositories/user.repository'
import { DataSource, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from 'src/budget/entities/category.entity'
import { categoryEnum } from 'src/budget/types/budget.enum'
import { Budget } from 'src/budget/entities/budget.entity'

@Injectable()
export class ExpenseService {
  constructor(
    private userRepository: UserRepository,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async createExpense(
    createExpenseDto: CreateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    try {
      const { category, ...rest } = createExpenseDto

      const spentDate = new Date()

      const consumer = await this.userRepository.findOne({
        where: { id: userId },
      })

      if (!consumer) {
        throw new NotFoundException('유저를 찾을 수 없습니다.')
      }

      const foundCategory = await this.categoryRepository.findOne({
        where: { name: category },
      })

      if (!foundCategory) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      const expenditure = this.expenseRepository.create({
        ...rest,
        category: foundCategory,
        spentDate,
        user: { id: userId },
      })

      return this.expenseRepository.save(expenditure)
    } catch (error) {
      throw new InternalServerErrorException('지출 생성에 문제가 발생했습니다.')
    }
  }

  async getAllExpense(userId: string) {
    return this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId })
      .getRawMany()
  }

  async getOneExpense(expenseId: number, userId: string) {
    const expenditure = await this.expenseRepository.findOne({
      where: { id: expenseId, user: { id: userId } },
    })

    if (!expenditure) {
      throw new NotFoundException(
        `해당 ${expenseId}의 지출을 찾을 수 없습니다.`,
      )
    }
    return expenditure
  }

  async updateExpense(
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
    userId: string,
  ): Promise<Expense> {
    const expenditure = await this.expenseRepository.findOne({
      where: { id: expenseId, user: { id: userId } },
      relations: ['user', 'category'],
    })

    if (!expenditure) {
      throw new NotFoundException('지출 데이터를 찾을 수 없습니다.')
    }

    if (expenditure.user.id !== userId) {
      throw new UnauthorizedException('접근 권한이 없습니다.')
    }

    if (updateExpenseDto.category) {
      const categoryKey = Object.keys(categoryEnum).find(
        (key) => categoryEnum[key] === updateExpenseDto.category,
      )
      if (!categoryKey) {
        throw new NotFoundException('유효하지 않은 카테고리입니다.')
      }

      const foundCategory = await this.categoryRepository.findOne({
        where: { name: updateExpenseDto.category },
      })

      if (!foundCategory) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.')
      }

      expenditure.category = foundCategory
    }

    Object.assign(expenditure, updateExpenseDto)

    return this.expenseRepository.save(expenditure)
  }

  async deleteExpense(expenseId: number, userId: string) {
    const result = await this.expenseRepository.delete({
      id: expenseId,
      user: { id: userId },
    })
    if (result.affected === 0) {
      throw new NotFoundException('해당 지출을 찾을 수 없습니다.')
    }
  }

  async recommendExpense(userId: string) {
    const todayRecommendedExpenseByCategory = []
    const miniBudget = 1000

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const totalDays = new Date(year, month, 0).getDate()
    const remainingDays = Math.max(totalDays - today.getDate() + 1, 1)
    const firstOfTheMonth = new Date(today.getFullYear(), today.getMonth(), 1) // 해당 월의 1일
    const enumLength = Object.keys(categoryEnum).length

    // 이번 연도, 월에 대한 카테고리 예산
    for (let i = 1; i < enumLength + 1; i++) {
      const categoryId = i
      const budget = await this.budgetRepository
        .createQueryBuilder('budget')
        .where('budget.user_id = :userId', { userId })
        .andWhere('budget.category_id = :categoryId', { categoryId })
        .andWhere('budget.year = :year', { year })
        .andWhere('budget.month = :month', { month })
        .getOne()

      if (!budget) {
        throw new NotFoundException(
          `${categoryId}에 대한 예산을 찾을 수 없습니다.`,
        )
      }

      let currentMonthExpenseCategoryAmount = await this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'amount')
        .where('expense.user_id = :userId', { userId })
        .andWhere('expense.spent_date >= :firstOfTheMonth', { firstOfTheMonth })
        .andWhere('expense.spent_date < :today', { today: today.toISOString() })
        .groupBy('expense.category_id')
        .getRawOne()

      if (!currentMonthExpenseCategoryAmount) {
        throw new NotFoundException(`오늘 사용할 예산을 계산할 수 없습니다.`)
      }

      currentMonthExpenseCategoryAmount = currentMonthExpenseCategoryAmount
        ? parseInt(currentMonthExpenseCategoryAmount.amount, 10)
        : 0

      // 오늘까지 남은 예산
      let remainingBudget = budget.amount - currentMonthExpenseCategoryAmount
      remainingBudget = remainingBudget < 0 ? 0 : remainingBudget

      // 해당 카테고리에 대해 오늘 추천 지출 금액
      let todaysRecommendedExpenditureAmount = Math.round(
        remainingBudget / remainingDays,
      )

      // 최소 추천 지출 금액
      todaysRecommendedExpenditureAmount =
        todaysRecommendedExpenditureAmount < miniBudget
          ? miniBudget
          : todaysRecommendedExpenditureAmount

      todayRecommendedExpenseByCategory.push({
        categoryId,
        todaysRecommendedExpenditureAmount,
      })
    }

    const todayRecommendedExpenseByCategoryExcludingTotal =
      todayRecommendedExpenseByCategory.slice(1)

    // 오늘 추천 지출 전체 금액
    const totalDailyBudget =
      todayRecommendedExpenseByCategoryExcludingTotal.reduce(
        (acc, cur) => acc + cur.todaysRecommendedExpenditureAmount,
        0,
      )

    const budgetICanUseToday =
      todayRecommendedExpenseByCategory[0].todaysRecommendedExpenditureAmount

    let message = ''
    if (totalDailyBudget > budgetICanUseToday) {
      message = '돈을 잘 아끼고 있네요. 오늘도 무지출 챌린지 가보자!'
    } else if (totalDailyBudget === budgetICanUseToday) {
      message = '합리적으로 소비하고 있네요 좋습니다.'
    } else if (totalDailyBudget < budgetICanUseToday) {
      message = '지출이 큽니가. 허리띠를 졸라매고 돈 좀 아껴쓰세요!'
    }
    return {
      totalDailyBudget,
      todayRecommendedExpenseByCategoryExcludingTotal,
      message,
    }
  }

  async guideExpense(userId: string) {
    const categoryExpense = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysIdealSpendingAmount = await this.recommendExpense(userId)
    const todayRecommendedExpenseByCategory =
      todaysIdealSpendingAmount.todayRecommendedExpenseByCategoryExcludingTotal

    const enumLength = Object.keys(categoryEnum).length

    // 오늘 기준 연도, 월에 대한 카테고리별 예산
    for (let i = 2; i < enumLength + 1; i++) {
      const categoryId = i
      const todaysSpentAmount = this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'amount')
        .where('expense.spent_date = :today', { today })
        .andWhere('expense.category = :categoryId', { categoryId })
        .groupBy('expense.category_id')
        .getRawOne()

      const totalTodaysSpentAmount = categoryExpense.reduce(
        (acc, cur) => acc + cur.todaysRecommendedExpenditureAmount,
        0,
      )

      const degreeOfDanger = Math.round(
        (todayRecommendedExpenseByCategory[i - 1]
          .todaysRecommendedExpenditureAmount /
          totalTodaysSpentAmount) *
          100,
      ).toFixed(0)

      categoryExpense.push({
        categoryId,
        todaysSpentAmount,
        degreeOfDanger,
      })
    }

    return categoryExpense
  }

  async compareRatioToLastMonth(userId: string) {
    const today = new Date()
    const dayOfMonth = today.getDate()

    const thisMonthStartDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    )
    const todayEndDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      dayOfMonth,
    )

    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    const lastMonthStartDate = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    )
    const lastMonthEndDate = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      dayOfMonth,
    )

    const lastMonthExpenditure = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.spent_date >= :lastMonthStartDate', {
        lastMonthStartDate,
      })
      .andWhere('expense.spent_date < :lastMonthEndDate', { lastMonthEndDate })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('expense.category_id')
      .getRawMany()

    const thisMonthExpenditure = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.spent_date >= :thisMonthStartDate', {
        thisMonthStartDate,
      })
      .andWhere('expense.spent_date < :todayEndDate', { todayEndDate })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('expense.category_id')
      .getRawMany()

    const [lastMonthExpenditures, thisMonthExpenditures] = await Promise.all([
      lastMonthExpenditure,
      thisMonthExpenditure,
    ])

    const expenditureRatioByCategory = lastMonthExpenditures.map(
      (lastMonth) => {
        const thisMonth = thisMonthExpenditures.find(
          (item) => item.categoryId === lastMonth.categoryId,
        )

        const lastMonthAmount = parseFloat(lastMonth.amount)
        const thisMonthAmount = thisMonth ? parseFloat(thisMonth.amount) : 0
        const ratio =
          thisMonthAmount > 0 ? (lastMonthAmount / thisMonthAmount) * 100 : 0

        return {
          categoryId: lastMonth.categoryId,
          lastMonthAmount,
          thisMonthAmount,
          ratio: ratio.toFixed(2) + '%',
        }
      },
    )

    return expenditureRatioByCategory
  }

  async compareRatioToLastWeek(userId: string) {
    const today = new Date()
    const dayOfWeek = today.getDay()

    const thisDay = new Date(today)
    thisDay.setDate(today.getDate() - (dayOfWeek - 1))

    const lastDay = new Date(thisDay)
    lastDay.setDate(thisDay.getDate() - 7)

    const nextToThisDay = new Date(thisDay)
    nextToThisDay.setDate(thisDay.getDate() + 1)

    const lastDayExpenditure = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.spent_date >= :lastDay', { lastDay })
      .andWhere('expense.spent_date < :thisDay', { thisDay })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('expense.category_id')
      .getRawMany()

    const thisDayExpenditure = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.spent_date >= :thisDay', { thisDay })
      .andWhere('expense.spent_date < :nextToThisDay', { nextToThisDay })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('expense.category_id')
      .getRawMany()

    const [lastWeekExpenditures, thisWeekExpenditures] = await Promise.all([
      lastDayExpenditure,
      thisDayExpenditure,
    ])

    const expenditureRatioByCategory = lastWeekExpenditures.map((lastWeek) => {
      const thisWeek = thisWeekExpenditures.find(
        (item) => item.categoryId === lastWeek.categoryId,
      )

      const lastWeekAmount = parseFloat(lastWeek.amount)
      const thisWeekAmount = thisWeek ? parseFloat(thisWeek.amount) : 0
      const ratio =
        thisWeekAmount > 0 ? (lastWeekAmount / thisWeekAmount) * 100 : 0

      return {
        categoryId: lastWeek.categoryId,
        lastWeekAmount,
        thisWeekAmount,
        ratio: ratio.toFixed(2) + '%',
      }
    })

    return expenditureRatioByCategory
  }
}
