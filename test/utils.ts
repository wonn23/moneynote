import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter'
import { initializeTransactionalContext } from 'typeorm-transactional'
import { DataSource } from 'typeorm'

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
      skipMissingProperties: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.init()

  return app
}

export async function closeNestApplication(
  app: INestApplication,
): Promise<void> {
  const dataSource: DataSource = app.get(DataSource)
  if (dataSource.isInitialized) {
    await dataSource.destroy()
  }

  await app.close()
}
