import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { UserRepository } from '../repository/user.repository'
import { CreateUserDto } from '../dto/create-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  // 회원가입
  async signUp(createUserDto: CreateUserDto): Promise<object> {
    const { username, password } = createUserDto

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = {
      username,
      password: hashedPassword,
    }
    try {
      await this.userRepository.createUser(user)

      return { message: '회원가입에 성공했습니다' }
    } catch (error) {
      console.error(error)
      if (error.code === '23505') {
        throw new ConflictException('존재하는 유저 이름입니다.')
      }
      throw new InternalServerErrorException('회원가입에 실패 했습니다.')
    }
  }
}
