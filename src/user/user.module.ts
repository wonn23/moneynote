import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmExModule } from 'src/common/decorator/typeorm-ex.module'
import { UserRepository } from './user.repository'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    TypeOrmExModule.forCustomRepository([UserRepository]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
