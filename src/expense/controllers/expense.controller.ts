import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { ExpenseService } from '../services/expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { Expense } from '../entities/expense.entity'
import { AuthGuard } from '@nestjs/passport'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('지출')
@ApiBearerAuth()
@UseGuards(AuthGuard())
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @ApiOperation({ summary: '지출생성', description: '유저의 지출 기록 생성' })
  @ApiResponse({
    status: 201,
    description: '성공',
    type: CreateExpenseDto,
  })
  @Post()
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @GetUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.createExpense(createExpenseDto, userId)
  }

  @ApiOperation({
    summary: '모든 지출 조회',
    description: '유저의 모든 지출 내역 조회',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Get()
  async getAllExpense(@GetUser() userId: string): Promise<Expense[]> {
    return this.expenseService.getAllExpense(userId)
  }

  @ApiOperation({
    summary: '상세 지출 조회',
    description: '유저의 상세 지출 기록 조회',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Get(':id')
  async getOneExpense(
    @Param('id') expenseId: string,
    @GetUser() userId: string,
  ): Promise<Expense> {
    return this.expenseService.getOneExpense(+expenseId, userId)
  }

  @ApiOperation({ summary: '지출 수정', description: '유저의 지출 기록 수정' })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Put(':id')
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

  @ApiOperation({ summary: '지출 삭제', description: '유저의 지출 기록 삭제' })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Delete(':id')
  async delete(
    @Param('id') expenseId: string,
    @GetUser() userId: string,
  ): Promise<void> {
    this.expenseService.deleteExpense(+expenseId, userId)
  }

  @Get('recommend')
  async recommendExpense(@GetUser() userId: string) {
    return await this.expenseService.recommendExpense(userId)
  }

  @Get('guide')
  async guideExpense(@GetUser() userId: string) {
    return await this.expenseService.guideExpense(userId)
  }

  @Get('statistics/monthly')
  async compareRatioToLastMonth(@GetUser() userId: string) {
    return await this.expenseService.compareRatioToLastMonth(userId)
  }

  @Get('statistics/weekly')
  async compareRatioToLastWeek(@GetUser() userId: string) {
    return await this.expenseService.compareRatioToLastWeek(userId)
  }
}
