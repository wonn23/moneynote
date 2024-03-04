import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Refresh } from './refresh.entity'
import { Budget } from 'src/budget/entities/budget.entity'

@Entity('users')
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column({ length: 20 })
  username: string

  @Column()
  password: string

  @Column({ nullable: false, type: 'boolean', default: false })
  consultingYn: boolean

  @Column({ nullable: true, type: 'varchar', default: false })
  discordUrl: string

  @OneToOne(() => Refresh, { nullable: true })
  @JoinColumn({ name: 'refresh_id' })
  refresh: Refresh

  @OneToMany(() => Budget, (budget) => budget.user)
  budget: Budget[]
}
