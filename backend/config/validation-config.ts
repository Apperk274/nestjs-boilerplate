import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ErrorMessage } from '@/helpers/error-handling/error-messages'

const pipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}
export const validationPipe = new ValidationPipe(pipeOptions)

class TransformTypesPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Dont do anything if metatype is undefined
    if (metadata.metatype == undefined) return value
    // Parse strings of number and boolean
    // Throw if cannot parse
    if (metadata.metatype.name == 'Number') {
      if (Number.isNaN(Number(value)))
        throw new BadRequestException(
          ErrorMessage.unexpectedType('number', typeof value)
        )
      else return Number(value)
    }
    if (metadata.metatype.name == 'Boolean') {
      switch (value) {
        case 'true':
          return true
        case 'false':
          return false
        default:
          throw new BadRequestException(
            ErrorMessage.unexpectedType('boolean', typeof value)
          )
      }
    }
    // Convert types of properties if query param
    return plainToInstance(metadata.metatype, value, {
      enableImplicitConversion: metadata.type === 'query',
    })
  }
}
export const transformTypesPipe = new TransformTypesPipe()
