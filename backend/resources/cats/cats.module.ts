import { Module } from '@nestjs/common'
import { CatsService } from './cats.service'
import { CatsController } from './cats.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CatEntity } from 'backend/resources/cats/entities/cat.entity'

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  imports: [TypeOrmModule.forFeature([CatEntity])],
})
export class CatsModule {}
