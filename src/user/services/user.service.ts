import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { User } from '../entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user.repository'
import { DataSource } from 'typeorm'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // 회원가입
  async signUp(
    username: string,
    password: string,
    consultingYn: boolean,
  ): Promise<object> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    const user = await queryRunner.manager
      .getRepository(User)
      .findOne({ where: { username } })

    if (user) {
      throw new ForbiddenException('이미 존재하는 유저이름입니다.')
    }

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    try {
      await queryRunner.manager.getRepository(User).save({
        username,
        password: hashedPassword,
        consultingYn,
      })

      await queryRunner.commitTransaction()
      return { message: '회원가입에 성공했습니다' }
    } catch (error) {
      console.error(error)
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException('서버에러')
    } finally {
      await queryRunner.release()
    }
  }
}
