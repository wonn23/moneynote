import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP')

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request
    const userAgent = request.get('user-agent') || ''

    response.on('finish', () => {
      /**
       * logger.middlewares.ts는 라우터보다 먼저 실행된다.
       * morgan은 라우터보다 먼저 실행돼서 request에 대해 기록한 후, 라우터가 끝나고 나서 로깅해준다.
       * response에 on을 붙이는 이유는 이 logger는 라우터보다 먼저 실행되기 때문이다.
       * 실행되는 코드 순서는 const 변수에 대한것이 실행되고 next()가 실행된다. 그 후, finish된 response가 로깅된다.
       *
       */
      const { statusCode } = response
      const contentLength = response.get('content-length')
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
      )
    })

    next()
  }
}
