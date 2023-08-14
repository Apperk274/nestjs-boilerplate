import { OmitType } from '@backend/helpers/mapped-types'
import { CatEntity } from '@backend/resources/cats/entities/cat.entity'
export class Cat extends OmitType(CatEntity, ['secret', 'deletedAt']) {}
