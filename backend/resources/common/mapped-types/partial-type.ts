import { PartialType as PartialTypeDefault } from '@nestjs/swagger'
import { Type } from '@nestjs/common'
import {
  copyClassData,
  type OmitStatics,
  getInstanceMemberNames,
  setOptionality,
} from './util'

export function PartialType<T extends Type<InstanceType<T>>>(clazz: T) {
  const instanceMemberNames = getInstanceMemberNames(clazz)
  class NewClass extends (PartialTypeDefault(clazz) as any) {}
  copyClassData(clazz, NewClass)
  instanceMemberNames.forEach(n => {
    setOptionality(NewClass, n, true)
  })
  return NewClass as OmitStatics<MakeInstancePartial<T>>
}

type MakeInstancePartial<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Partial<InstanceType<T>> }
