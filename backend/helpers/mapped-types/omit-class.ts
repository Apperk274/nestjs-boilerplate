import { Type } from '@nestjs/common'
import { copyClassData } from './util'
import type {
  OmitStatics,
  RemoveKeysFromInstance,
} from '@/helpers/type-helpers'

export function OmitClass<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T, keys: readonly K[]) {
  class NewClass {}
  copyClassData(clazz, NewClass, { excludedMembers: keys })
  return NewClass as OmitStatics<RemoveKeysFromInstance<T, K>>
}
