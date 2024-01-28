import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Query,
  UsePipes,
  Put,
} from '@nestjs/common'
import { BudgetService } from '../services/budget.service'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'
import { getBudgetValidationPipe } from '../pipes/get-budget.pipe'
import { Budget } from '../entities/budget.entity'
import { BudgetRecommendationDto } from '../dto/budget-recommendation.dto'

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  // 예산 추가
  // @UseGuards(AuthGuard())
  async create(@Body() createBudgetDto: CreateBudgetDto): Promise<Budget> {
    return this.budgetService.createBudget(createBudgetDto)
  }

  @Post('/design')
  // 예산 설계 추천
  // @UseGuards(AuthGuard('jwt'))
  async design(
    @Body('totalAmount') totalAmount: number,
  ): Promise<BudgetRecommendationDto> {
    return this.budgetService.designBudget(totalAmount)
  }

  @Get()
  // 예산 조회 연도별
  // @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYear(@Query('year') year: number): Promise<Budget[]> {
    return this.budgetService.findBudgetByYear(year)
  }

  @Get()
  // 예산 조회 연월별
  // @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYearAndMonth(
    @Query('year') year: number,
    @Query('month') month: number,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYearAndMonth(year, month)
  }

  @Put(':id')
  // @UseGuards(AuthGuard())
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    return this.budgetService.updateBudget(+id, updateBudgetDto)
  }

  @Delete(':id')
  // @UseGuards(AuthGuard())
  async remove(@Param('id') id: string): Promise<void> {
    await this.budgetService.deleteBudget(+id)
  }
}
