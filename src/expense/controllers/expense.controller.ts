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
} from '@nestjs/common'
import { ExpenseService } from '../services/expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { Expense } from '../entities/expense.entity'
import { AuthGuard } from '@nestjs/passport'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('지출')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({
    summary: '지출 생성',
    description: '유저의 지출 기록을 생성합니다.',
  })
  @ApiCreatedResponse({ description: '지출 생성 성공', type: Expense })
  @ApiNotFoundResponse({ description: '유저 혹은 카테고리를 찾을 수 없음' })
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @GetUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.createExpense(createExpenseDto, userId)
  }

  @Get()
  @ApiOperation({
    summary: '모든 지출 조회',
    description: '유저의 모든 지출 내역을 조회합니다.',
  })
  @ApiOkResponse({ description: '조회 성공', type: [Expense] })
  @ApiNotFoundResponse({ description: '지출 내역을 찾을 수 없음' })
  async getAllExpense(@GetUser() userId: string): Promise<Expense[]> {
    return this.expenseService.getAllExpense(userId)
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
    @GetUser() userId: string,
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
    @GetUser() userId: string,
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
    @GetUser() userId: string,
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
  async recommendExpense(@GetUser() userId: string) {
    return await this.expenseService.recommendExpense(userId)
  }

  @Get('alarm/guide')
  @ApiOperation({
    summary: '오늘의 지출 안내',
    description: '유저에게 오늘의 지출 안내 정보를 제공합니다.',
  })
  @ApiOkResponse({ description: '안내 정보 제공 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async guideExpense(@GetUser() userId: string) {
    return await this.expenseService.guideExpense(userId)
  }

  @Get('statistics/monthly')
  @ApiOperation({
    summary: '월별 지출 비교',
    description: '지난 달과 이번 달의 지출을 비교합니다.',
  })
  @ApiOkResponse({ description: '비교 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async compareRatioToLastMonth(@GetUser() userId: string) {
    return await this.expenseService.compareRatioToLastMonth(userId)
  }

  @Get('statistics/weekly')
  @ApiOperation({
    summary: '주별 지출 비교',
    description: '지난 주와 이번 주의 지출을 비교합니다.',
  })
  @ApiOkResponse({ description: '비교 성공' })
  @ApiNotFoundResponse({ description: '유저를 찾을 수 없음' })
  async compareRatioToLastWeek(@GetUser() userId: string) {
    return await this.expenseService.compareRatioToLastWeek(userId)
  }
}
