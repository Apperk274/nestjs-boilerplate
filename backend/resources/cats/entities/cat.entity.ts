import { EntityBase } from '@backend/resources/common/entity-base'
import { Column, Entity } from 'typeorm'

@Entity()
export class CatEntity extends EntityBase {
  @Column()
  name: string

  @Column({ type: 'int' })
  age: number

  @Column()
  secret: string
}
