import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, Logger } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter'
import { NestExpressApplication } from '@nestjs/platform-express'
import { initializeTransactionalContext } from 'typeorm-transactional'

async function bootstrap() {
  initializeTransactionalContext()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: true,
  })

  app.enableCors({
    origin: true,
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('moneynote') // 프로젝트 명 바꾸기
    .setDescription('The moneynote API description') // 프로젝트 설명 추가
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('swagger', app, document)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  const configService = app.get(ConfigService)
  const port = configService.get('PORT') || 3000
  await app.listen(port)
  Logger.log(`Application running on port ${port}`)
}
bootstrap()
