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
import { Category } from './category.entity'
import { User } from 'src/user/entities/user.entity'
import { ApiProperty } from '@nestjs/swagger'

@Entity('budget')
export class Budget extends BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: '예산 ID', example: 1 })
  id: number

  @Column({ type: 'integer' })
  @ApiProperty({ description: '예산 연도', example: 2024 })
  year: number

  @Column({ type: 'integer' })
  @ApiProperty({ description: '예산 월', example: 12 })
  month: number

  @Column({ type: 'integer' })
  @ApiProperty({ description: '예산 금액', example: 100000 })
  amount: number

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
  @JoinColumn({ name: 'category_id' })
  category: Category

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
