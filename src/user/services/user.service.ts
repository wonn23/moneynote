import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { User } from '../entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Transactional()
  async signUp(
    username: string,
    password: string,
    consultingYn: boolean,
  ): Promise<object> {
    const user = await this.userRepository.findOneBy({ username })

    if (user) {
      throw new ForbiddenException('이미 존재하는 유저이름입니다.')
    }

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    try {
      await this.userRepository.save({
        username,
        password: hashedPassword,
        consultingYn,
      })

      return { message: '회원가입에 성공했습니다' }
    } catch (error) {
      console.error(error)
      throw new InternalServerErrorException('서버에러')
    }
  }
}
