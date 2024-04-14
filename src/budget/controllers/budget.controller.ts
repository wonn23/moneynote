import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Put,
  ParseIntPipe,
  Inject,
  Query,
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { Budget } from '../entities/budget.entity'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from 'src/common/decorator/current-user.decorator'
import { IBUDGET_SERVICE } from 'src/common/utils/constants'
import { IBudgetService } from '../interfaces/budget.service.interface'
import { BudgetAmount } from '../interfaces/budget-design.interface'
import { JwtAccessAuthGuard } from 'src/auth/guard/jwt-access.guard'

@ApiTags('예산')
@ApiBearerAuth()
@UseGuards(JwtAccessAuthGuard)
@Controller('budgets')
export class BudgetController {
  constructor(@Inject(IBUDGET_SERVICE) private budgetService: IBudgetService) {}

  @Post()
  @ApiOperation({
    summary: '예산 생성',
    description: '유저가 카테고리별 예산 금액을 설정합니다.',
  })
  @ApiCreatedResponse({
    description: '예산 생성 성공',
    type: Budget,
  })
  @ApiNotFoundResponse({
    description: '카테고리를 찾을 수 없습니다.',
  })
  @ApiInternalServerErrorResponse({
    description: '서버 내부 오류가 발생했습니다.',
  })
  async create(
    @Body() createBudgetDto: CreateBudgetDto,
    @CurrentUser() userId: string,
  ): Promise<Budget> {
    return this.budgetService.createBudget(createBudgetDto, userId)
  }

  @Get('/')
  @ApiOperation({
    summary: '예산 조회 연도별 또는 연도와 월별',
    description: '예산을 연도별로 또는 연도와 월로 조회할 수 있습니다.',
  })
  @ApiOkResponse({ description: '예산 조회 성공', type: [Budget] })
  @ApiNotFoundResponse({
    description: '해당 연도 또는 월의 예산 데이터를 찾을 수 없습니다.',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    description: '조회할 연도',
    example: 2024,
    type: Number,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: '조회할 월',
    example: 3,
    type: Number,
  })
  async findBudgets(
    @CurrentUser() userId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month') month?: number,
  ): Promise<Budget[]> {
    if (month) {
      return this.budgetService.findBudgets(userId, year, month)
    } else {
      return this.budgetService.findBudgets(userId, year)
    }
  }

  @Post('/design')
  @ApiOperation({
    summary: '예산 추천',
    description: '총 금액 입력시 자동으로 카테고리별 예산을 설정해줍니다.',
  })
  @ApiCreatedResponse({
    description: '예산 추천 성공',
    type: [Budget],
  })
  @ApiNotFoundResponse({
    description: '해당 연도와 월의 예산 데이터를 찾을 수 없습니다.',
  })
  @ApiInternalServerErrorResponse({
    description: '서버 내부 오류가 발생했습니다.',
  })
  @ApiProperty({
    name: 'totalAmount',
    example: 1000000,
    description: '예산 총금액',
  })
  @ApiProperty({ name: 'year', example: 2024, description: '연도' })
  @ApiProperty({ name: 'month', example: 3, description: '월' })
  async design(
    @Body('totalAmount') totalAmount: number,
    @Body('year') year: number,
    @Body('month') month: number,
  ): Promise<BudgetAmount[]> {
    return this.budgetService.designBudget(totalAmount, year, month)
  }

  @Put(':id')
  @ApiOperation({
    summary: '예산 수정',
    description: '유저가 예산을 수정할 수 있습니다.',
  })
  @ApiOkResponse({ description: '예산 수정 성공', type: Budget })
  @ApiNotFoundResponse({
    description: '예산 아이디 혹은 카테고리 찾을 수 없습니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '예산 아이디',
    example: 1,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @CurrentUser() userId: string,
  ): Promise<Budget> {
    return this.budgetService.updateBudget(id, updateBudgetDto, userId)
  }

  @Delete(':id')
  @ApiOperation({
    summary: '예산 삭제',
    description: '유저가 예산을 삭제할 수 있습니다.',
  })
  @ApiOkResponse({ description: '예산 수정 성공' })
  @ApiNotFoundResponse({
    description: '예산 아이디 혹은 카테고리 찾을 수 없습니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '예산 아이디',
    example: 1,
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.budgetService.deleteBudget(id)
  }
}
