import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'
import { Refresh } from './refresh.entity'

@Entity('users')
@Unique(['username'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ length: 50 })
  username: string

  @Column()
  password: string

  @OneToOne(() => Refresh, { nullable: true })
  @JoinColumn()
  refresh: Refresh
}
