import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { DataSource } from 'typeorm'
import { ICACHE_SERVICE } from 'src/common/utils/constants'

export async function createNestApplication(): Promise<INestApplication> {
  initializeTransactionalContext()
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.init()

  return app
}

export async function closeNestApplication(
  app: INestApplication,
): Promise<void> {
  try {
    const dataSource: DataSource = app.get(DataSource)
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy()
    } else {
      console.log('데이터베이스 이미 종료됨 혹은 초기화되지 않음')
    }

    const redisService = app.get(ICACHE_SERVICE)
    const redisClient = redisService.cacheManager.store.getClient()
    await redisClient.quit()
  } catch (error) {
    console.error('Failed to close data source or Redis', error)
  }

  await app.close()
}
