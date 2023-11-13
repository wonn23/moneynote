import { Category } from 'src/budget/entities/category.entity'
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
  date: Date

  @Column({ nullable: true })
  totalSum: number

  @Column({ nullable: true })
  currentSum: number

  @Column()
  content: string

  @Column()
  isSum: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category
}
