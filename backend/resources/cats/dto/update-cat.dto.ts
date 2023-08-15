import { PartialClass } from '@backend/helpers/mapped-types'
import { CreateCatDto } from './create-cat.dto'

export class UpdateCatDto extends PartialClass(CreateCatDto) {}
