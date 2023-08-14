import { Type } from '@nestjs/common'
import { getInstanceMemberNames, copyClassData, type OmitStatics } from './util'

export function PickType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T, keys: K[]) {
  const excludedKeys = getInstanceMemberNames(clazz).filter(
    k => !keys.includes(k as any)
  )
  class NewClass {}
  copyClassData(clazz, NewClass, { excludedMembers: excludedKeys })
  return NewClass as OmitStatics<PickKeysForInstance<T, K>>
}

type PickKeysForInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Pick<InstanceType<T>, K> }
