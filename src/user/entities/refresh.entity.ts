import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm'

@Entity()
export class Refresh extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true, type: 'varchar', default: '' })
  token: string
}
