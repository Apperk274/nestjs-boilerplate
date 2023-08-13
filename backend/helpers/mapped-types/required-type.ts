import { Type } from '@nestjs/common'
import {
  getOwnInstanceMemberNames,
  setOptionality,
  performRecursively,
  type OmitStatics,
} from './util'

export function RequiredType<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass extends (clazz as any) {}
  performRecursively(NewClass, cl => {
    getOwnInstanceMemberNames(cl).forEach(n => setOptionality(cl, n, false))
  })
  return NewClass as OmitStatics<MakeInstanceRequired<T>>
}

type MakeInstanceRequired<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Required<InstanceType<T>> }
