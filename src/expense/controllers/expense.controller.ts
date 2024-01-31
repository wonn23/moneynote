import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UsePipes,
  UseGuards,
} from '@nestjs/common'
import { ExpenseService } from '../services/expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { ExpenseValidationPipe } from '../pipes/expense.pipe'
import { Expense } from '../entities/expense.entity'
import { AuthGuard } from '@nestjs/passport'
import { GetUser } from 'src/auth/decorator/get-user.decorator'
import { User } from 'src/user/entities/user.entity'

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  // 지출 생성
  // @UseGuards(AuthGuard())
  // @UsePipes(ExpenseValidationPipe)
  async create(
    @Param('id') id: string,
    @Body() createExpenseDto: CreateExpenseDto,
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.createExpense(+id, createExpenseDto, user)
  }

  @Get()
  // 모든 지출 조회
  // @UseGuards(AuthGuard())
  async findAll(@GetUser() user: User): Promise<Expense[]> {
    return this.expenseService.getAllExpense(user)
  }

  @Get(':id')
  // 지출 상세 조회
  // @UseGuards(AuthGuard())
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.getOneExpense(+id, user)
  }

  @Put(':id')
  // 지출 수정
  // @UseGuards(AuthGuard())
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @GetUser() user: User,
  ): Promise<Expense> {
    return this.expenseService.updateExpense(+id, updateExpenseDto, user)
  }

  @Delete(':id')
  // 지출 삭제
  // @UseGuards(AuthGuard())
  async remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    this.expenseService.deleteExpense(+id, user)
  }
}
