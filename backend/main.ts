import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  transformTypesPipe,
  validationPipe,
} from 'backend/config/validation-config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { generateModels } from '@/code-generation/generate-models'
import { generateApis } from '@/code-generation/generate-apis'
import 'reflect-metadata'
import type { NestExpressApplication } from '@nestjs/platform-express'

async function bootstrap() {
  process.env.TZ = 'Etc/UTC'
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // Importing env
  const configService = app.get(ConfigService)
  const dev = configService.get<NodeEnv>('NODE_ENV') == 'development'
  // Generate frontend models
  if (dev) {
    await generateModels()
    await generateApis()
  }
  // Middlewares / Pipes
  app.enableCors()
  app.setGlobalPrefix('api')
  app.useGlobalPipes(transformTypesPipe, validationPipe)
  // Configuring OpenAPI (Swagger)
  const config = new DocumentBuilder()
    .setTitle('NestJS Application')
    .setDescription('API description')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      controllerKey.replace('Controller', '').toLowerCase() + '$' + methodKey,
  })
  SwaggerModule.setup('api', app, document)
  await app.listen(configService.get<number>('PORT') ?? 3000)
}
bootstrap()

type NodeEnv = 'development' | 'production'
