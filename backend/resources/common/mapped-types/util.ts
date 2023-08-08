import { Type } from '@nestjs/common'
import { ReflectedMethod, ReflectedProperty, reflect } from 'typescript-rtti'

export function addToReflect(clazz: Type, prop: ReflectedProperty): void
export function addToReflect(clazz: Type, method: ReflectedMethod): void
export function addToReflect(
  clazz: Type,
  member: ReflectedProperty | ReflectedMethod
): void {
  if (member instanceof ReflectedProperty) {
    const reflectedProp = new ReflectedProperty(
      member.class,
      member.name,
      member.isStatic
    )
    if (member.isStatic) {
      reflect(clazz).staticPropertyNames.push(member.name)
      reflect(clazz).staticProperties.push(reflectedProp)
    } else {
      reflect(clazz).propertyNames.push(member.name)
      reflect(clazz).properties.push(reflectedProp)
    }
  } else if (member instanceof ReflectedMethod) {
    const reflectedMethod = new ReflectedMethod(
      member.class,
      member.name,
      member.isStatic
    )
    if (member.isStatic) {
      reflect(clazz).staticMethodNames.push(member.name)
      reflect(clazz).staticMethods.push(reflectedMethod)
    } else {
      reflect(clazz).methodNames.push(member.name)
      reflect(clazz).methods.push(reflectedMethod)
    }
  }
}

export type OmitStatics<T> = T extends {
  new (...args: infer A): infer R
}
  ? { new (...args: A): R } & Omit<T, never>
  : never
