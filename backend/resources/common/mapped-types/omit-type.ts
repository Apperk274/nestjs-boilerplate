import { OmitType as OmitTypeDefault } from '@nestjs/swagger'
import { Type } from '@nestjs/common'
import { copyClassData, removeInstanceMembers, type OmitStatics } from './util'

export function OmitType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T, keys: readonly K[]) {
  class NewClass extends (OmitTypeDefault(clazz, keys) as any) {}
  copyClassData(clazz, NewClass)
  removeInstanceMembers(NewClass, keys)
  return NewClass as OmitStatics<RemoveKeysFromInstance<T, K>>
}

type RemoveKeysFromInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Omit<InstanceType<T>, K> }
