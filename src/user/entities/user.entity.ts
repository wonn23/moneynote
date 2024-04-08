import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique,
} from 'typeorm'
import { Budget } from 'src/budget/entities/budget.entity'

@Entity('users')
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column({ length: 20 })
  username: string

  @Column()
  email: string

  @Column({ nullable: true })
  password: string

  @Column({ nullable: true })
  providerId: string

  @Column({ nullable: true, type: 'boolean', default: false })
  consultingYn: boolean

  @Column({ nullable: true, type: 'varchar', default: '' })
  discordUrl: string

  @OneToMany(() => Budget, (budget) => budget.user)
  budget: Budget[]
}
