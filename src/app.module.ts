import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CatsModule } from './cats/cats.module'
import { join } from 'path'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DB_CSTR'),
        synchronize: process.env.NODE_ENV !== 'production',
        entities: [join(__dirname, '**/*.entity.{ts,js}')],
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    // Feature modules
    CatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
