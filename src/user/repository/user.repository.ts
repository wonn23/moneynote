import { Repository } from 'typeorm'
import { CustomRepository } from '../../common/typeorm-ex.decorator'
import { CreateUserDto } from '../dto/create-user.dto'
import { User } from '../entities/user.entity'

@CustomRepository(User)
export class UserRepository extends Repository<User> {
  // 유저 생성
  async createUser(user: CreateUserDto): Promise<void> {
    await this.save(user)
  }

  // username으로 유저 찾기
  async findByUsername(username: string): Promise<User> {
    const user = await this.findOne({ where: { username } })

    return user
  }

  // id로 유저 찾기
  async findById(id: string): Promise<User> {
    const user = await this.findOne({ where: { id } })

    return user
  }
}
