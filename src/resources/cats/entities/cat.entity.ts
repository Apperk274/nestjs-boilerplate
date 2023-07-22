import { EntityBase } from 'src/config/entity-base'
import { Column, Entity } from 'typeorm'

@Entity()
export class Cat extends EntityBase {
  @Column()
  name: string

  @Column({ type: 'int' })
  age: number
}
