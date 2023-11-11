import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common'
import { BudgetService } from '../services/budget.service'
import { UpdateBudgetDto } from '../dto/update-budget.dto'
import { CreateBudgetDto } from '../dto/create-budget.dto'
import { AuthGuard } from '@nestjs/passport'

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  // @UseGuards(AuthGuard())
  async create(@Body() createBudgetDto: CreateBudgetDto): Promise<void> {
    this.budgetService.createBudget(createBudgetDto)
  }

  @Post()
  @UseGuards(AuthGuard())
  async design() {
    this.budgetService.designBudget()
  }

  @Get()
  async findAll() {
    return this.budgetService.findAll()
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
