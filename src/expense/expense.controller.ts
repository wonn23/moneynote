import { IEXPENSE_SERVICE } from '../common/utils/constants'
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Inject,
  Query,
} from '@nestjs/common'
import { CreateExpenseDto } from './dto/create-expense.dto'
import { UpdateExpenseDto } from './dto/update-expense.dto'
import { Expense } from './entities/expense.entity'
import { CurrentUser } from 'src/common/decorator/current-user.decorator'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import { IExpenseSerivce } from './interfaces/expense.service.interface'
import { RecommendedExpense } from './interfaces/expense-recommend.interface'
import { JwtAccessAuthGuard } from 'src/auth/guard/jwt-access.guard'

@ApiTags('지출')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessAuthGuard)
@Controller('expense')
export class ExpenseController {
  constructor(
    @Inject(IEXPENSE_SERVICE) private expenseService: IExpenseSerivce,
  ) {}

  @Post()
  @ApiOperation({
    summary: '지출 생성',
    description: '유저의 지출 기록을 생성합니다.',
  })
  @ApiCreatedResponse({ description: '지출 생성 성공', type: Expense })
  @ApiNotFoundResponse({ description: '유저 혹은 카테고리를 찾을 수 없음' })
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @CurrentUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.createExpense(createExpenseDto, userId)
  }

  @Get()
  @ApiOperation({
    summary: '지정된 기간 동안의 지출 조회',
    description: '유저가 지정한 기간 동안의 모든 지출 내역을 조회합니다.',
  })
  @ApiOkResponse({ description: '조회 성공', type: [Expense] })
  @ApiNotFoundResponse({ description: '지출 내역을 찾을 수 없음' })
  async getAllExpense(
    @CurrentUser() userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Expense[]> {
    const parsedStartDate = new Date(startDate)
    const parsedEndDate = new Date(endDate)
    return this.expenseService.getAllExpense(
      userId,
      parsedStartDate,
      parsedEndDate,
    )
  }

  @Get(':id')
  @ApiOperation({
    summary: '상세 지출 조회',
    description: '특정 지출의 상세 내용을 조회합니다.',
  })
  @ApiOkResponse({ description: '상세 조회 성공', type: Expense })
  @ApiNotFoundResponse({ description: '지출 또는 유저를 찾을 수 없음' })
  @ApiParam({
    name: 'id',
    required: true,
    description: '지출 아이디',
    example: 1,
  })
  async getOneExpense(
    @Param('id', ParseIntPipe) expenseId: number,
    @CurrentUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.getOneExpense(expenseId, userId)
  }

  @Put(':id')
  @ApiOperation({
    summary: '지출 수정',
    description: '유저의 특정 지출 기록을 수정합니다.',
  })
  @ApiOkResponse({ description: '지출 수정 성공', type: Expense })
  @ApiNotFoundResponse({
    description: '지출 또는 유저를 찾을 수 없음',
  })
  @ApiParam({ name: 'id', description: '지출 아이디' })
  async update(
    @Param('id') expenseId: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @CurrentUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.updateExpense(
      +expenseId,
      updateExpenseDto,
      userId,
    )
  }

  @Delete(':id')
  @ApiOperation({
    summary: '지출 삭제',
    description: '유저의 특정 지출 기록을 삭제합니다.',
  })
  @ApiOkResponse({ description: '지출 삭제 성공' })
  @ApiNotFoundResponse({ description: '지출 또는 유저를 찾을 수 없음' })
  async delete(
    @Param('id', ParseIntPipe) expenseId: number,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.expenseService.deleteExpense(expenseId, userId)
  }

  @Get('alarm/recommend')
  @ApiOperation({
    summary: '오늘의 지출 추천',
    description: '유저에게 오늘의 지출 추천 정보를 제공합니다.',
  })
  @ApiOkResponse({ description: '추천 정보 제공 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async recommendExpense(
    @CurrentUser() userId: string,
  ): Promise<RecommendedExpense> {
    return await this.expenseService.recommendExpense(userId)
  }

  @Get('alarm/guide')
  @ApiOperation({
    summary: '오늘의 지출 안내',
    description: '유저에게 오늘의 지출 안내 정보를 제공합니다.',
  })
  @ApiOkResponse({ description: '안내 정보 제공 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async guideExpense(@CurrentUser() userId: string) {
    return await this.expenseService.guideExpense(userId)
  }

  @Get('statistics/monthly')
  @ApiOperation({
    summary: '월별 지출 비교',
    description: '지난 달과 이번 달의 지출을 비교합니다.',
  })
  @ApiOkResponse({ description: '비교 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async compareRatioToLastMonth(@CurrentUser() userId: string) {
    return await this.expenseService.compareRatioToLastMonth(userId)
  }

  @Get('statistics/weekly')
  @ApiOperation({
    summary: '주별 지출 비교',
    description: '지난 주와 이번 주의 지출을 비교합니다.',
  })
  @ApiOkResponse({ description: '비교 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async compareRatioToLastWeek(@CurrentUser() userId: string) {
    return await this.expenseService.compareRatioToLastWeek(userId)
  }
}
