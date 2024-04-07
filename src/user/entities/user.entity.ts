import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm'
import { Refresh } from './refresh.entity'
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

  @Column()
  password: string

  @Column({ nullable: true, type: 'boolean', default: false })
  consultingYn: boolean

  @Column({ nullable: true, type: 'varchar', default: '' })
  discordUrl: string

  @OneToOne(() => Refresh, { nullable: true })
  @JoinColumn({ name: 'refresh_id' })
  refresh: Refresh

  @OneToMany(() => Budget, (budget) => budget.user)
  budget: Budget[]
}
