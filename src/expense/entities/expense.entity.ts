import { Category } from 'src/budget/entities/category.entity'
import { User } from 'src/user/entities/user.entity'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
@Entity('expense')
export class Expense extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  amount: number

  @Column({ nullable: true })
  memo: string

  @Column()
  spentDate: Date

  @Column({ default: false })
  isExcluded: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User
}
