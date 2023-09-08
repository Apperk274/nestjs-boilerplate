import { Type } from '@nestjs/common'
import { setOptionality, copyClassData, getInstanceMemberNames } from './util'
import type { MakeInstanceRequired, OmitStatics } from '@/helpers/type-helpers'

export function RequiredClass<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass {}
  copyClassData(clazz, NewClass)
  getInstanceMemberNames(clazz).forEach(n => setOptionality(NewClass, n, false))
  return NewClass as OmitStatics<MakeInstanceRequired<T>>
}
