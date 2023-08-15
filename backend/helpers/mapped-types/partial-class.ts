import { Type } from '@nestjs/common'
import {
  setOptionality,
  getInstanceMemberNames,
  copyClassData,
  type OmitStatics,
} from './util'

export function PartialClass<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass {}
  copyClassData(clazz, NewClass)
  getInstanceMemberNames(clazz).forEach(n => setOptionality(NewClass, n, true))
  return NewClass as OmitStatics<MakeInstancePartial<T>>
}

type MakeInstancePartial<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Partial<InstanceType<T>> }
