import { OmitType as OmitTypeDefault } from '@nestjs/swagger'
import { reflect } from 'typescript-rtti'
import { Type } from '@nestjs/common'
import {
  addToReflect,
  type OmitStatics,
} from '@backend/resources/common/mapped-types/util'

export function OmitType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T>
>(clazz: T, keys: readonly K[]) {
  // Creating a class that extends from the class T
  class NewClass extends (OmitTypeDefault(clazz, keys) as any) {}

  const staticMethods = reflect(clazz).staticMethods
  for (const staticMethod of staticMethods) {
    addToReflect(NewClass, staticMethod)
    // Copying the static method to the new class
    NewClass[staticMethod.name] = clazz[staticMethod.name]
  }

  const staticProps = reflect(clazz).staticProperties
  for (const staticProp of staticProps) {
    addToReflect(NewClass, staticProp)
    // Copying the static prop to the new class
    NewClass[staticProp.name] = clazz[staticProp.name]
  }

  const props = reflect(clazz).properties.filter(
    p => !keys.includes(p.name as K)
  )
  for (const prop of props) {
    addToReflect(NewClass, prop)
    // No need to copy the props since they are inherited (also their default values)
  }

  const methods = reflect(clazz).methods.filter(
    m => !keys.includes(m.name as K)
  )
  for (const method of methods) {
    addToReflect(NewClass, method)
    // Copying the default value of the method to the new class
    NewClass.prototype[method.name] = clazz.prototype[method.name]
  }

  // Returning the new class and asserting its type
  return NewClass as OmitStatics<RemoveKeysFromInstance<T, K>>
}

type RemoveKeysFromInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Omit<InstanceType<T>, K> }
