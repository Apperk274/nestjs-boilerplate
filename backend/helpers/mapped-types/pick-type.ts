import { Type } from '@nestjs/common'
import {
  getOwnInstanceMemberNames,
  removeInstanceMembers,
  performRecursively,
  type OmitStatics,
} from './util'

export function PickType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T, keys: K[]) {
  class NewClass extends (clazz as any) {}
  performRecursively(NewClass, cl => {
    const toRemove = getOwnInstanceMemberNames(cl).filter(
      k => !keys.includes(k as any)
    )
    removeInstanceMembers(cl, toRemove)
  })
  return NewClass as OmitStatics<PickKeysForInstance<T, K>>
}

type PickKeysForInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Pick<InstanceType<T>, K> }
