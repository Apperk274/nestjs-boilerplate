import { ValidationPipeOptions } from '@nestjs/common'

// interface ValidationPipeOptions extends ValidatorOptions {
//   transform?: boolean
//   disableErrorMessages?: boolean
//   exceptionFactory?: (errors: ValidationError[]) => any
// }

export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}
