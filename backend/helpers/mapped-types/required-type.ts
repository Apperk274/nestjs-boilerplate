import { Type } from '@nestjs/common'
import {
  setOptionality,
  copyClassData,
  getInstanceMemberNames,
  type OmitStatics,
} from './util'

export function RequiredType<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass {}
  copyClassData(clazz, NewClass)
  getInstanceMemberNames(clazz).forEach(n => setOptionality(NewClass, n, false))
  return NewClass as OmitStatics<MakeInstanceRequired<T>>
}

type MakeInstanceRequired<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Required<InstanceType<T>> }
