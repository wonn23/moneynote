import { Module } from '@nestjs/common'
import { UserService } from './service/user.service'
import { UserController } from './controller/user.controller'
import { TypeOrmExModule } from '../common/typeorm-ex.module'
import { UserRepository } from './repository/user.repository'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmExModule],
})
export class UserModule {}
