import { OmitType } from '@nestjs/swagger'
import { CatEntity } from '@backend/resources/cats/entities/cat.entity'
export class Cat extends OmitType(CatEntity, ['secret']) {}
