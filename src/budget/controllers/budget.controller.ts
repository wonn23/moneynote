import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Query,
  UsePipes,
} from '@nestjs/common'
import { BudgetService } from '../services/budget.service'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'
import { getBudgetValidationPipe } from '../pipes/get-budget.pipe'

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @UseGuards(AuthGuard())
  async create(@Body() createBudgetDto: CreateBudgetDto): Promise<void> {
    this.budgetService.createBudget(createBudgetDto)
  }

  @Post()
  @UseGuards(AuthGuard())
  async design() {
    this.budgetService.designBudget()
  }

  @Get('/all:yearMonth')
  @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findAll(@Query('yearMonth') yearMonth: string) {
    return this.budgetService.findAllBudget(yearMonth)
  }

  @Get()
  @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findOne(@Query('yearMonth') yearMonth: string) {
    console.log(yearMonth)
    return this.budgetService.findOneBudget(yearMonth)
  }

  @Patch(':id')
  @UseGuards(AuthGuard())
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(+id, updateBudgetDto)
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async remove(@Param('id') id: string) {
    return this.budgetService.remove(+id)
  }
}
