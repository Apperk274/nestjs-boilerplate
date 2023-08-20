import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { validationPipe } from 'backend/config/validation-config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { generateModels } from '@/code-generation/generate-models'
import { startFrontend } from '@/config/start-frontend'

async function bootstrap() {
  process.env.TZ = 'Etc/UTC'
  await generateModels()
  // startFrontend()
  const app = await NestFactory.create(AppModule)
  // Importing env
  const configService = app.get(ConfigService)
  // Middlewares / Pipes
  app.setGlobalPrefix('api')
  app.useGlobalPipes(validationPipe)
  // Configuring OpenAPI (Swagger)
  const config = new DocumentBuilder()
    .setTitle('NestJS Application')
    .setDescription('API description')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
  await app.listen(configService.get<number>('PORT') ?? 3000)
}
bootstrap()
