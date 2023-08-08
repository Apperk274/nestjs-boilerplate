import { PickType as PickTypeDefault } from '@nestjs/swagger'
import { reflect } from 'typescript-rtti'
import { Type } from '@nestjs/common'
import { OmitStatics } from '@backend/resources/common/mapped-types/util'

export function PickType<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T>
>(clazz: T, keys: readonly K[]) {
  // Creating a class that extends from the class T
  class NewClass extends (PickTypeDefault(clazz, keys) as any) {}
  // Static methods of the new class
  const staticMethodNames = reflect(clazz).staticMethodNames
  for (const staticMethodName of staticMethodNames) {
    reflect(NewClass).staticMethodNames.push(staticMethodName.toString())
    NewClass[staticMethodName] = clazz[staticMethodName]
  }
  // Static properties of the new class
  const staticPropNames = reflect(clazz).staticPropertyNames
  for (const staticPropName of staticPropNames) {
    reflect(NewClass).staticPropertyNames.push(staticPropName.toString())
    NewClass[staticPropName] = clazz[staticPropName]
  }
  // Properties of the new class
  const propNames = reflect(clazz).propertyNames.filter(k =>
    keys.includes(k as K)
  )
  for (const propName of propNames) {
    reflect(NewClass).propertyNames.push(propName.toString())
    // No need to copy the props since they are inherited (also their default values)
  }
  // Methods of the new class
  const methodNames = reflect(clazz).methodNames.filter(k =>
    keys.includes(k as K)
  )
  for (const methodName of methodNames) {
    reflect(NewClass).methodNames.push(methodName.toString())
    NewClass.prototype[methodName] = clazz.prototype[methodName]
  }
  // Returning the new class and asserting its type
  return NewClass as OmitStatics<PickKeysForInstance<T, K>>
}
type PickKeysForInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Pick<InstanceType<T>, K> }
