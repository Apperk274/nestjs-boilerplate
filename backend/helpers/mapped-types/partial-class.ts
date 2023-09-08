import { Type } from '@nestjs/common'
import { setOptionality, getInstanceMemberNames, copyClassData } from './util'
import type { MakeInstancePartial, OmitStatics } from '@/helpers/type-helpers'

export function PartialClass<T extends Type<InstanceType<T>>>(clazz: T) {
  class NewClass {}
  copyClassData(clazz, NewClass)
  getInstanceMemberNames(clazz).forEach(n => setOptionality(NewClass, n, true))
  return NewClass as OmitStatics<MakeInstancePartial<T>>
}
