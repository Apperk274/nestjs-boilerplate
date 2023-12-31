import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { CatsService } from './cats.service'
import { CreateCatDto } from './dto/create-cat.dto'
import { UpdateCatDto } from './dto/update-cat.dto'
import { Cat } from '@/resources/cats/dto/cat.dto'

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    await this.catsService.create(createCatDto)
    return 'Cat added'
  }

  @Get()
  async findAll() {
    const [entities, count] = await this.catsService.findAll()
    return [Cat.fromMany(entities), count] as const
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catsService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return this.catsService.update(+id, updateCatDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catsService.remove(+id)
  }
}
