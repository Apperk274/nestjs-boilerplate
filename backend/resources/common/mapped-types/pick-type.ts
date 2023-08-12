import { PickType as PickTypeDefault } from '@nestjs/swagger'
import { Type } from '@nestjs/common'
import {
  copyClassData,
  getInstanceMemberNames,
  removeInstanceMembers,
  type OmitStatics,
} from './util'

export function PickType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T>
>(clazz: T, keys: readonly K[] & string) {
  const toRemove = getInstanceMemberNames(clazz).filter(k => !keys.includes(k))
  class NewClass extends (PickTypeDefault(clazz, keys) as any) {}
  copyClassData(clazz, NewClass)
  removeInstanceMembers(NewClass, toRemove)
  return NewClass as OmitStatics<PickKeysForInstance<T, K>>
}

type PickKeysForInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Pick<InstanceType<T>, K> }
