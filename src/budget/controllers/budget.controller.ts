import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Query,
  UsePipes,
  Put,
} from '@nestjs/common'
import { BudgetService } from '../services/budget.service'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'
import { getBudgetValidationPipe } from '../pipes/get-budget.pipe'
import { Budget } from '../entities/budget.entity'

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  // @UseGuards(AuthGuard())
  async create(@Body() createBudgetDto: CreateBudgetDto): Promise<void> {
    this.budgetService.createBudget(createBudgetDto)
  }

  @Post()
  // @UseGuards(AuthGuard('jwt'))
  async design() {
    this.budgetService.designBudget()
  }

  @Get('/all')
  // @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYear(
    @Query('yearMonth') yearMonth: string,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYear(yearMonth)
  }

  @Get()
  // @UseGuards(AuthGuard())
  @UsePipes(new getBudgetValidationPipe())
  async findBudgetByYearAndMonth(
    @Query('yearMonth') yearMonth: string,
  ): Promise<Budget[]> {
    return this.budgetService.findBudgetByYearAndMonth(yearMonth)
  }

  @Put(':id')
  // @UseGuards(AuthGuard())
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetService.setBudget(+id, updateBudgetDto)
  }

  @Delete(':id')
  // @UseGuards(AuthGuard())
  async remove(@Param('id') id: string): Promise<void> {
    await this.budgetService.deleteBudget(+id)
  }
}
