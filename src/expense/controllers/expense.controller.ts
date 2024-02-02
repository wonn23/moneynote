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
import { User } from 'src/user/entities/user.entity'
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
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.createExpense(createExpenseDto, user)
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
  async findAll(@GetUser() user: User): Promise<Expense[]> {
    return this.expenseService.getAllExpense(user)
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
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.getOneExpense(+id, user)
  }

  @ApiOperation({ summary: '지출 수정', description: '유저의 지출 기록 수정' })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.updateExpense(+id, updateExpenseDto, user)
  }

  @ApiOperation({ summary: '지출 삭제', description: '유저의 지출 기록 삭제' })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.expenseService.deleteExpense(+id, user)
  }
}
