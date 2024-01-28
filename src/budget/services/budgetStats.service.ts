import { Injectable } from '@nestjs/common'

@Injectable()
export class BudgetStatsService {
  async getAverageBudgetRatios(): Promise<{ [key: string]: number }> {
    return {
      food: 0.4, // 40%
      transportation: 0.1,
      curtureLife: 0.1,
      housingCommunication: 0.3, // 30%
      dailyNeccessities: 0.13, // 13%
    }
  }
}
