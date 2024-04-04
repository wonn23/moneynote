import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { Expense } from '../entities/expense.entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Category } from 'src/budget/entities/category.entity'
import { Budget } from 'src/budget/entities/budget.entity'
import { User } from 'src/user/entities/user.entity'
import { IExpenseSerivce } from '../interfaces/expense.service.interface'
import { Transactional } from 'typeorm-transactional'
import { RecommendedExpense } from '../interfaces/expense-recommend.interface'
import {
  IBUDGET_SERVICE,
  IEXPENSE_CALCULATION_SERVICE,
  IEXPENSE_MESSAGE_SERVICE,
} from 'src/common/di.tokens'
import { IExpenseCalculationService } from '../interfaces/expense.calculation.service.interface'
import { IExpenseMessageService } from '../interfaces/expense.message.service.interface'
import { IBudgetService } from 'src/budget/interfaces/budget.service.interface'

@Injectable()
export class ExpenseService implements IExpenseSerivce {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(IEXPENSE_CALCULATION_SERVICE)
    private expenseCalculationService: IExpenseCalculationService,
    @Inject(IEXPENSE_MESSAGE_SERVICE)
    private expenseMessageService: IExpenseMessageService,
    @Inject(IBUDGET_SERVICE)
    private budgetservice: IBudgetService,
  ) {}

  @Transactional()
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
    return
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

  async getAllExpense(userId: string): Promise<Expense[]> {
    await this.validateUserExists(userId)

    const expenses = await this.expenseRepository.find({
      where: { user: { id: userId } },
    })

    if (expenses.length === 0) {
      throw new NotFoundException(
        `유저 ${userId})의 지출 내역이 존재하지 않습니다.`,
      )
    }
    return expenses
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

  @Transactional()
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
    const firstOfTheMonth = new Date(year, month - 1, 1) // 해당 월의 1일
    const totalDays = new Date(year, month, 0).getDate()
    const remainingDays = Math.max(totalDays - today.getDate() + 1, 1)
    const minBudget = 1000

    // 해당 카테고리의 예산 찾기
    const budgets = await this.budgetservice.findBudgetByYearAndMonth(
      year,
      month,
      userId,
    )
    // 1일부터 오늘까지 사용한 지출액
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'amount')
      .where('expense.user_id = :userId', { userId })
      .andWhere('expense.spent_date BETWEEN :firstOfTheMonth AND :today', {
        firstOfTheMonth,
        today,
      })
      .groupBy('expense.category_id')
      .getRawMany()

    // 지출이 undedined이면 기본값을 '0'원으로 한다.
    const todayRecommendedExpenseByCategory = budgets.map((budget) => {
      const expense = expenses.find(
        (e) => e.categoryId === budget.category.id,
      ) || { amount: '0' }
      const currentMonthExpenseCategoryAmount = parseInt(expense.amount, 10)
      // 오늘까지 남은 예산
      let remainingBudget = budget.amount - currentMonthExpenseCategoryAmount
      remainingBudget = Math.max(remainingBudget, 0)

      // 해당 카테고리에 대해 오늘 추천 지출 금액
      let todaysRecommendedExpenseAmount =
        Math.floor(remainingBudget / remainingDays / 100) * 100

      // 예산이 0원이 아니고, 오늘까지 남은 예산이 minBudget 이하일 때만 minBudget 적용
      if (
        budget.amount > 0 &&
        remainingBudget > 0 &&
        todaysRecommendedExpenseAmount < minBudget
      ) {
        todaysRecommendedExpenseAmount = minBudget
      }

      return {
        categoryName: budget.category.name,
        todaysRecommendedExpenseAmount,
      }
    })

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
    // 오늘 추천 예산
    const availableDailyBudget =
      filteredTodayRecommendedExpenseByCategory.reduce(
        (total, cur) => total + cur.todaysRecommendedExpenseAmount,
        0,
      )
    this.expenseMessageService.getRecommendationMessage(
      availableDailyBudget,
      dailyBudgetAllowance,
    )
    let message = ''
    if (availableDailyBudget < dailyBudgetAllowance) {
      message = '돈을 잘 아끼고 있네요. 오늘도 무지출 챌린지 가보자!'
    } else if (availableDailyBudget === dailyBudgetAllowance) {
      message = '합리적으로 소비하고 있네요 좋습니다.'
    } else if (availableDailyBudget > dailyBudgetAllowance) {
      message = '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!'
    }
    return {
      availableDailyBudget,
      filteredTodayRecommendedExpenseByCategory,
      message,
    }
  }

  async guideExpense(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysIdealSpendingAmount = await this.recommendExpense(userId)
    const todayRecommendedExpenseByCategory =
      todaysIdealSpendingAmount.filteredTodayRecommendedExpenseByCategory

    // 오늘 기준 연도, 월에 대한 카테고리별 지출 액수 조회
    const todaysSpentAmount = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category_id', 'categoryId')
      .addSelect('SUM(expense.amount)', 'totalAmount')
      .innerJoin('expense.category', 'category')
      .where('expense.spent_date >= :today', { today })
      .andWhere('expense.spent_date < :tomorrow', {
        tomorrow,
      })
      .andWhere('expense.user_id = :userId', { userId })
      .groupBy('expense.category_id')
      .getRawMany()

    // 비율 계산
    const calculateExpenseRatio = (recommendedExpenses, actualExpenses) => {
      return recommendedExpenses.reduce((acc, recommendedExpense) => {
        const actualExpense = actualExpenses.find(
          (expense) => expense.categoryId === recommendedExpense.categoryId,
        )

        if (actualExpense) {
          const ratio =
            (parseInt(actualExpense.totalAmount) /
              recommendedExpense.todaysRecommendedExpenditureAmount) *
            100
          acc.push({
            categoryId: recommendedExpense.categoryId,
            ratio: `${ratio.toFixed(2)}%`,
          })
        }

        return acc
      }, [])
    }

    const expenseRatios = calculateExpenseRatio(
      todayRecommendedExpenseByCategory,
      todaysSpentAmount,
    )

    return expenseRatios
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

    // 각 데이터에 접근하는 쿼리는 비동기이고 독립적이므로 Promise.all() 사용
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
