import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { lastValueFrom } from 'rxjs'
import { ExpenseService } from 'src/expense/services/expense.service'
import { createDailyExpenseReportMessage } from './webhook.payloads'
import { createDailyExpenseGuideMessage } from './webhook.payloads'
import { IEXPENSE_SERVICE } from 'src/common/utils/constants'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)
  constructor(
    private httpService: HttpService,
    @Inject(IEXPENSE_SERVICE) private expenseService: ExpenseService,
  ) {}

  calculateUsageStatus() {}

  // @Cron('*/5 * * * * *') // 테스트용
  @Cron(CronExpression.EVERY_DAY_AT_6AM, { name: 'recommendExpenditureAlarm' })
  async sendRecommendMessage(userId: string) {
    this.logger.log('Sending daily expense report to Discord')

    const webhookUrl =
      'https://discord.com/api/webhooks/1222855875522461776/rGhM5I8c-qA1LLMQkHiTKgLQMCquhskYiGHrFgTkEBCZ1D6GOQGcTqLR0oX_1BpAq3oS'
    try {
      // const recommendation = await this.expenseService.recommendExpense(userId) // totalDailyBudget, todayRecommendedExpenseByCategoryExcludingTotal, message
      // const message = createDailyExpenseReportMessage(recommendation)
      // const response = this.httpService.post(webhookUrl, message)
      // await lastValueFrom(response)
      // this.logger.log('Daily expense report sent successfully')
    } catch (error) {
      console.error(error)
      this.logger.error('Failed to send daily expense report', error)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9PM)
  async sendGuideMessage(userId: string) {
    this.logger.log('Sending daily expense guide to Discord')

    const webhookUrl =
      'https://discord.com/api/webhooks/1222076507338575903/bI7B5BXr16M5FO2XOInNY7WGsxp3gKaRzsGkvYnAhbmMv_3nRebUOKeiPtmcUGeSKsA7'

    try {
      const guide = this.expenseService.guideExpense('userId')
      const message = createDailyExpenseGuideMessage(guide)

      const response = this.httpService.post(webhookUrl, message)
    } catch (error) {
      this.logger.error('Failed to send daily expense report', error)
    }
  }
}
