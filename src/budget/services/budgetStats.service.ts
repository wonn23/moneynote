import { Injectable } from '@nestjs/common'

@Injectable()
export class BudgetStatsService {
  async getAverageBudgetRatios(): Promise<{ [key: string]: number }> {
    // 기존 유저들이 설정한 평균값
    return {
      food: 0.4,
      transportation: 0.1,
      curtureLife: 0.1,
      housingCommunication: 0.3,
      dailyNeccessities: 0.13,
    }
  }
}
