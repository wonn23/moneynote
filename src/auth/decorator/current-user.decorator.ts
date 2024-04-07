import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { User } from 'src/user/entities/user.entity'

// 요청안에 있는 user 값을 가지고 온다.
export const CurrentUser = createParamDecorator(
  (data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest()
    return req.user
  },
)
