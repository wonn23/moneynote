import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Query,
  Put,
  ParseIntPipe,
} from '@nestjs/common'
import { BudgetService } from '../services/budget.service'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'
import { Budget } from '../entities/budget.entity'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import { User } from 'src/user/entities/user.entity'

@ApiTags('예산 설정')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

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
  @ApiCreatedResponse({
    description: '성공',
    type: Object,
  })
  @Post('/design')
  async design(
    @Body('totalAmount') totalAmount: number,
    @Body('year') year: number,
    @Body('month') month: number,
  ) {
    return this.budgetService.designBudget(totalAmount, year, month)
  }

  @Get('/year')
  // 예산 조회 연도별
  async findBudgetByYear(
    @Query('year', ParseIntPipe) year: number,
    @GetUser() user: User,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYear(year, user)
  }

  @Get('/year-and-month')
  // 예산 조회 연월별
  async findBudgetByYearAndMonth(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @GetUser() user: User,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYearAndMonth(year, month, user)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @GetUser() userId: User,
  ): Promise<Budget> {
    return this.budgetService.updateBudget(+id, updateBudgetDto, userId)
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.budgetService.deleteBudget(+id)
  }
}
