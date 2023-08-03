import { Injectable } from '@nestjs/common'
import { CreateCatDto } from './dto/create-cat.dto'
import { UpdateCatDto } from './dto/update-cat.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Cat } from '@backend/resources/cats/entities/cat.entity'

@Injectable()
export class CatsService {
  constructor(
    @InjectRepository(Cat)
    private catsRepository: Repository<Cat>
  ) {}
  async create(createCatDto: CreateCatDto) {
    await this.catsRepository.save(createCatDto)
  }

  findAll() {
    return this.catsRepository.findAndCount()
  }

  findOne(id: number) {
    return `This action returns a #${id} cat`
  }

  update(id: number, updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`
  }

  remove(id: number) {
    return `This action removes a #${id} cat`
  }
}
