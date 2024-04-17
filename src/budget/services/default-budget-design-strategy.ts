import { Injectable, NotFoundException } from '@nestjs/common'
import {
  BudgetAmount,
  IBudgetDesignStrategy,
  Ratio,
} from '../interfaces/budget-design.interface'

@Injectable()
export class DefaultBudgetDesignStrategy implements IBudgetDesignStrategy {
  async designBudget(ratio: Ratio[], totalAmount: number): Promise<any[]> {
    if (!ratio || ratio.length === 0) {
      throw new NotFoundException(
        '해당 연도의 월의 평균 예산 데이터가 존재하지 않습니다.',
      )
    }
    const totalCategoryRatio = this.ensureTotalRatioEqualsOne(ratio)
    const budgetDesigns = this.calculateBudgetDesigns(
      ratio,
      totalAmount,
      totalCategoryRatio,
    )

    const filteredBudgets = this.filterAndAllocateOtherBudgets(
      budgetDesigns,
      totalAmount,
    ) // 전체 예산의 10% 이하인 카테고리는 '기타'로 분류한다.

    return filteredBudgets
  }

  private ensureTotalRatioEqualsOne(ratios: Ratio[]): number {
    const sum = ratios.reduce(
      (total, curr) => total + parseFloat(curr.ratio),
      0,
    )
    return sum !== 1 ? 1 : sum
  }

  private calculateBudgetDesigns(
    ratios: Ratio[],
    totalAmount: number,
    totalCategoryRatio: number,
  ): BudgetAmount[] {
    return ratios
      .filter((ratio) => ratio.categoryName !== '전체')
      .map((ratio) => {
        const calculateAmount =
          (totalAmount * parseFloat(ratio.ratio)) / totalCategoryRatio
        return {
          categoryName: ratio.categoryName,
          budgetAmount: Math.round(calculateAmount),
        }
      })
  }

  private filterAndAllocateOtherBudgets(
    budgetDesigns: BudgetAmount[],
    totalAmount: number,
    threshold = 0.1,
  ): BudgetAmount[] {
    const thresholdAmount = totalAmount * threshold
    let otherTotalBudget = 0

    const allocatedBudgets = budgetDesigns.reduce((total, curr) => {
      if (curr.budgetAmount <= thresholdAmount) {
        // 10% 이하 예산은 '기타'로 누적
        otherTotalBudget += curr.budgetAmount
      } else {
        total.push(curr)
      }
      return total
    }, [])

    if (otherTotalBudget > 0) {
      // '기타' 카테고리에 대한 예산 항목 추가
      allocatedBudgets.push({
        categoryName: '기타',
        budgetAmount: otherTotalBudget,
      })
    }

    return allocatedBudgets
  }
}
