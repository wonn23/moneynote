import { ApiProperty } from '@nestjs/swagger'
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
  @ApiProperty({ description: '지출 ID', example: 1 })
  id: number

  @Column()
  @ApiProperty({ description: '지출 금액', example: 10000 })
  amount: number

  @Column({ nullable: true })
  @ApiProperty({ description: '메모', example: '점심 식사', nullable: true })
  memo: string

  @Column()
  @ApiProperty({
    description: '지출 날짜',
    type: 'string',
    format: 'date-time',
  })
  spentDate: Date

  @Column({ default: false })
  @ApiProperty({ description: '지출 제외 여부', example: false })
  isExcluded: boolean

  @CreateDateColumn()
  @ApiProperty({ description: '생성일', type: 'string', format: 'date-time' })
  createdAt: Date

  @UpdateDateColumn()
  @ApiProperty({
    description: '업데이트일',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date

  @DeleteDateColumn()
  @ApiProperty({
    description: '삭제일',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  deletedAt: Date

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category: Category

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User
}
