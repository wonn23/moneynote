import { Module } from '@nestjs/common'
import { UserService } from './services/user.service'
import { UserController } from './controllers/user.controller'
import { TypeOrmExModule } from '../common/typeorm-ex.module'
import { UserRepository } from './repositories/user.repository'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmExModule],
})
export class UserModule {}
