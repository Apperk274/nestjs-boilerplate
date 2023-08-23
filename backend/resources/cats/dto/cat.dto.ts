import { OmitClass } from '@/helpers/mapped-types'
import { CatEntity } from '@/resources/cats/entities/cat.entity'
export class Cat extends OmitClass(CatEntity, ['secret', 'deletedAt']) {}
