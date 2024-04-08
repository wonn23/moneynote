import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeORMConfig } from './config/typeorm'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { BudgetModule } from './budget/budget.module'
import { ExpenseModule } from './expense/expense.module'
import { WebhookModule } from './webhook/webhook.module'
import { LoggerMiddleware } from './common/middlewares/logger.middleware'
import { addTransactionalDataSource } from 'typeorm-transactional'
import { DataSource } from 'typeorm'
import { RedisCacheModule } from './cache/cache.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed')
        }
        return addTransactionalDataSource(new DataSource(options))
      },
    }),
    AuthModule,
    UserModule,
    BudgetModule,
    ExpenseModule,
    WebhookModule,
    RedisCacheModule,
  ],
})
// 미들웨어들은 consumer에다가 연결한다.
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
