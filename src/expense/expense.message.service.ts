import { Injectable } from '@nestjs/common'
import { IExpenseMessageService } from './interfaces/expense.message.service.interface'

@Injectable()
export class ExpenseMessageService implements IExpenseMessageService {
  getRecommendationMessage(
    availableDailyExpense: number,
    dailyBudgetAllowance: number,
  ): string {
    if (availableDailyExpense < dailyBudgetAllowance) {
      return '돈을 잘 아끼고 있네요. 오늘도 무지출 챌린지 가보자!'
    } else if (availableDailyExpense === dailyBudgetAllowance) {
      return '합리적으로 소비하고 있네요 좋습니다.'
    } else {
      return '지출이 큽니다. 허리띠를 졸라매고 돈 좀 아껴쓰세요!'
    }
  }
}
