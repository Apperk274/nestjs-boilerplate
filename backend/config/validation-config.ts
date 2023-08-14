import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common'

const pipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}

export const validationPipe = new ValidationPipe(pipeOptions)
