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
} from '@nestjs/common'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'
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
  ApiTags,
} from '@nestjs/swagger'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import { User } from 'src/user/entities/user.entity'
import { IBUDGET_SERVICE } from 'src/common/di.tokens'
import { IBudgetService } from '../interfaces/budget.service.interface'
import { BudgetDesign } from '../interfaces/budget-design.interface'

@ApiTags('예산')
@ApiBearerAuth()
@UseGuards(AuthGuard())
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
    @GetUser() user: User,
  ): Promise<Budget> {
    return this.budgetService.createBudget(createBudgetDto, user)
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
  ): Promise<BudgetDesign[]> {
    return this.budgetService.designBudget(totalAmount, year, month)
  }

  @Get('/year/:year')
  @ApiOperation({
    summary: '예산 조회 연도별',
    description: '예산을 연도별로 조회할 수 있습니다.',
  })
  @ApiOkResponse({ description: '예산 조회 성공', type: [Budget] })
  @ApiNotFoundResponse({
    description: '해당 연도의 예산 데이터를 찾을 수 없습니다.',
  })
  @ApiParam({
    name: 'year',
    required: true,
    description: '조회할 연도',
    example: 2024,
  })
  async findBudgetByYear(
    @Param('year', ParseIntPipe) year: number,
    @GetUser() user: User,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYear(year, user)
  }

  @Get('/year/:year/month/:month')
  @ApiOperation({
    summary: '예산 조회 연도와 월별',
    description: '예산을 연도와 월로 조회할 수 있습니다.',
  })
  @ApiOkResponse({ description: '예산 조회 성공', type: [Budget] })
  @ApiNotFoundResponse({
    description: '해당 연도와 월의 예산 데이터를 찾을 수 없습니다.',
  })
  @ApiParam({
    name: 'year',
    required: true,
    description: '조회할 연도',
    example: 2024,
  })
  @ApiParam({
    name: 'month',
    required: true,
    description: '조회할 월',
    example: 3,
  })
  async findBudgetByYearAndMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @GetUser() user: User,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYearAndMonth(year, month, user)
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
    @GetUser() userId: User,
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
