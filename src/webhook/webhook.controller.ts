import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { WebhookService } from './webhook.service'
import { CurrentUser } from 'src/common/decorator/current-user.decorator'
import { AuthGuard } from '@nestjs/passport'

@ApiTags('컨설팅')
@UseGuards(AuthGuard())
@Controller('webhook')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Get('recommend')
  @ApiOperation({ summary: '오늘의 지출 추천' })
  async recommendTodayExpenditure(@CurrentUser() userId: string) {
    await this.webhookService.sendRecommendMessage(userId)
  }

  @Get('guide')
  @ApiOperation({ summary: '오늘의 지출 안내' })
  async guideTodayExpenditure(@CurrentUser() userId: string) {
    await this.webhookService.sendGuideMessage(userId)
  }
}
