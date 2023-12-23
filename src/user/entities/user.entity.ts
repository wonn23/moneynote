import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Refresh } from './refresh.entity'
import { Budget } from 'src/budget/entities/budget.entity'

@Entity('users')
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ length: 20 })
  username: string

  @Column()
  password: string

  @OneToOne(() => Refresh, { nullable: true })
  @JoinColumn()
  refresh: Refresh

  @OneToMany(() => Budget, (budget) => budget.user)
  budget: Budget[]
}
