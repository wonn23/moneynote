import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { categoryEnum } from '../types/budget.enum'

@Entity('categories')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({
    type: 'enum',
    enum: categoryEnum,
  })
  name: categoryEnum
}
