import { Type } from '@nestjs/common'
import { getInstanceMemberNames, copyClassData } from './util'
import type { OmitStatics, PickKeysForInstance } from '@/helpers/type-helpers'

export function PickClass<
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
