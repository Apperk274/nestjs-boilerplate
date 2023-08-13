import { Type } from '@nestjs/common'
import {
  getOwnInstanceMemberNames,
  setOptionality,
  performRecursively,
  type OmitStatics,
} from './util'

export function PartialType<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass extends (clazz as any) {}
  performRecursively(NewClass, cl => {
    getOwnInstanceMemberNames(cl).forEach(n => setOptionality(cl, n, true))
  })
  return NewClass as OmitStatics<MakeInstancePartial<T>>
}

type MakeInstancePartial<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Partial<InstanceType<T>> }
