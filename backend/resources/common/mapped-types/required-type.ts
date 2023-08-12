import { Type } from '@nestjs/common'
import {
  copyClassData,
  type OmitStatics,
  getInstanceMemberNames,
  setOptionality,
} from './util'

export function RequiredType<T extends Type<InstanceType<T>>>(clazz: T) {
  const instanceMemberNames = getInstanceMemberNames(clazz)
  class NewClass extends (clazz as any) {}
  copyClassData(clazz, NewClass)
  instanceMemberNames.forEach(n => {
    setOptionality(NewClass, n, false)
  })
  return NewClass as OmitStatics<MakeInstanceRequired<T>>
}

type MakeInstanceRequired<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Required<InstanceType<T>> }
