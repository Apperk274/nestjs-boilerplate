import { IsInt, IsString, Length } from 'class-validator'

export class CreateCatDto {
  @IsString()
  @Length(1, 32)
  name: string
  @IsInt()
  age: number
}

enum Enum {
  a = 'a',
  b = 'b',
  c = 'c',
}

class X {
  a: string
  b: number
}
class Y {
  b: number
  c: boolean
}
