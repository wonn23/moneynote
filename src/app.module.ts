import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeORMConfig } from './config/typeorm.config'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { BudgetModule } from './budget/budget.module'
import { ExpenseModule } from './expense/expense.module'
import { WebhookModule } from './webhook/webhook.module'
import { LoggerMiddleware } from './common/middlewares/logger.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema,
      load: [],
      cache: true,
      envFilePath: [
        process.env.NODE_ENV === 'production'
          ? '.production.env'
          : '.development.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await typeORMConfig(configService),
    }),
    AuthModule,
    UserModule,
    BudgetModule,
    ExpenseModule,
    WebhookModule,
  ],
})
// 미들웨어들은 consumer에다가 연결한다.
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
