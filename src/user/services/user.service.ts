import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { User } from '../entities/user.entity'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { Transactional } from 'typeorm-transactional'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateUser } from '../interface/user.interface'
import { CreateUserDto } from '../dto/create-user.dto'
import { UpdateUserDto } from '../dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Transactional()
  async register(createUserDto: CreateUserDto): Promise<CreateUser> {
    const { username, email, password, consultingYn } = createUserDto

    const user = await this.userRepository.findOneBy({ email })

    if (user) {
      throw new ForbiddenException('이미 존재하는 이메일입니다.')
    }

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    await this.userRepository.save({
      username,
      email,
      password: hashedPassword,
      consultingYn,
    })

    return { message: '회원가입에 성공했습니다' }
  }

  @Transactional()
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId })
    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다.')
    }

    await this.userRepository.save({
      ...user,
      ...updateUserDto,
    })
  }

  async delete(userId: string) {
    const result = await this.userRepository.delete({
      id: userId,
    })
    if (result.affected === 0) {
      throw new NotFoundException(`해당 유저의 ${userId}를 찾을 수 없습니다.`)
    }
  }
}
