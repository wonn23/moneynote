import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
} from '@nestjs/common'
import { ExpenseService } from '../services/expense.service'
import { CreateExpenseDto } from '../dto/create-expense.dto'
import { UpdateExpenseDto } from '../dto/update-expense.dto'
import { ExpenseValidationPipe } from '../pipes/expense.pipe'

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @UsePipes(ExpenseValidationPipe)
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.createExpense(createExpenseDto)
  }

  @Get()
  async findAll() {
    return this.expenseService.getAllExpense()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expenseService.getOneExpense(+id)
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expenseService.setExpense(+id, updateExpenseDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    this.expenseService.deleteExpense(+id)
  }
}
