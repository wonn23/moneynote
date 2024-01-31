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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import { User } from 'src/user/entities/user.entity'

@ApiTags('예산 설정')
@ApiBearerAuth()
// @UseGuards(AuthGuard())
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @ApiOperation({
    summary: '예산 설정',
    description: '유저가 카테고리별 예산 금액을 설정합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '성공',
    type: CreateBudgetDto,
  })
  @Post()
  // 예산 설정
  async create(
    @Body() createBudgetDto: CreateBudgetDto,
    @GetUser() user: User,
  ): Promise<Budget> {
    return this.budgetService.createBudget(createBudgetDto, user)
  }

  @ApiOperation({
    summary: '예산 추천',
    description: '총 금액 입력시 자동으로 카테고리별 예산을 설정해줍니다.',
  })
  @ApiQuery({
    name: 'totalAmount',
    required: true,
    description: '예산 총금액',
    example: 1000000,
  })
  @ApiResponse({
    status: 201,
    description: '성공',
    type: Object,
  })
  @Post('/design')
  // 예산 설계 추천
  async design(@Body('totalAmount') totalAmount: number): Promise<object[]> {
    return this.budgetService.getUserAverageRatio(totalAmount)
  }

  @Get()
  // 예산 조회 연도별
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYear(@Query('year') year: number): Promise<Budget[]> {
    return this.budgetService.findBudgetByYear(year)
  }

  @Get()
  // 예산 조회 연월별
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYearAndMonth(
    @Query('year') year: number,
    @Query('month') month: number,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYearAndMonth(year, month)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<Budget> {
    return this.budgetService.updateBudget(+id, updateBudgetDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.budgetService.deleteBudget(+id)
  }
}
