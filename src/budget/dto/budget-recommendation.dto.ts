export class BudgetRecommendationDto {
  food: number
  transportation: number
  curtureLife: number
  housingCommunication: number
  dailyNeccessities: number
  other: number

  constructor(recommendations: { [key: string]: number }) {
    this.food = recommendations.food || 0
    this.transportation = recommendations.transportation || 0
    this.curtureLife = recommendations.curtureLife || 0
    this.housingCommunication = recommendations.housingCommunication || 0
    this.dailyNeccessities = recommendations.dailyNeccessities || 0
    this.other = recommendations.other || 0
  }
}
