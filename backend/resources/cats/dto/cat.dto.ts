import { CatEntity } from '@backend/resources/cats/entities/cat.entity'
import { OmitType } from '@backend/resources/common/mapped-types'
export class Cat extends OmitType(CatEntity, ['secret']) {}
