import { Type } from '@nestjs/common'

const rtti = {
  PROPS: 'rt:P',
  METHODS: 'rt:m',
  STATIC_PROPS: 'rt:SP',
  STATIC_METHODS: 'rt:Sm',
  FORMAT: 'rt:f',
} as const

export function removeInstanceMembers<T extends Type<InstanceType<T>>>(
  clazz: Type,
  memberNamesToRemove: readonly string[]
) {
  const propNames = Reflect.getMetadata(rtti.PROPS, clazz) as string[]
  const newPropNames = propNames.filter(pN => !memberNamesToRemove.includes(pN))
  Reflect.defineMetadata(rtti.PROPS, newPropNames, clazz)

  const methodNames = Reflect.getMetadata(rtti.METHODS, clazz) as string[]
  const newMethodNames = methodNames.filter(
    pN => !memberNamesToRemove.includes(pN)
  )
  Reflect.defineMetadata(rtti.METHODS, newMethodNames, clazz)

  memberNamesToRemove.forEach(propName => {
    delete clazz.prototype[propName]
    Reflect.getMetadataKeys(clazz.prototype, propName).forEach(key => {
      Reflect.deleteMetadata(key, clazz.prototype, propName)
    })
  })
}

export function copyClassData<T extends Type<InstanceType<T>>>(
  superClass: T,
  NewClass: Type
) {
  // Copy instance property names
  const propNames = Reflect.getMetadata(rtti.PROPS, superClass) as string[]
  Reflect.defineMetadata(rtti.PROPS, propNames, NewClass)

  // Copy metadata of instance properties (type, optionality, mutability etc.)
  propNames.forEach(propName => {
    Reflect.getMetadataKeys(superClass.prototype, propName).forEach(key => {
      const value = Reflect.getMetadata(key, superClass.prototype, propName)
      Reflect.defineMetadata(key, value, NewClass.prototype, propName)
      // * No need to copy the props since they are inherited (also their default values)
    })
  })

  // Copy instance method names
  const methodNames = Reflect.getMetadata(rtti.METHODS, superClass) as string[]
  Reflect.defineMetadata(rtti.METHODS, methodNames, NewClass)

  // Copy metadata of instance methods (type, optionality, parameters etc.)
  methodNames.forEach(methodName => {
    Reflect.getMetadataKeys(superClass.prototype, methodName).forEach(key => {
      const value = Reflect.getMetadata(key, superClass.prototype, methodName)
      Reflect.defineMetadata(key, value, NewClass.prototype, methodName)
      // Copy the default value of the method to the new class's instances
      NewClass.prototype[methodName] = superClass.prototype[methodName]
    })
  })

  // Copy static property names
  const staticPropNames = Reflect.getMetadata(
    rtti.STATIC_PROPS,
    superClass
  ) as string[]
  Reflect.defineMetadata(rtti.STATIC_PROPS, staticPropNames, NewClass)

  // Copy metadata of static properties (type, optionality, mutability etc.)
  staticPropNames.forEach(propName => {
    Reflect.getMetadataKeys(superClass, propName).forEach(key => {
      const value = Reflect.getMetadata(key, superClass, propName)
      Reflect.defineMetadata(key, value, NewClass, propName)
      // Copy the value of the static prop to the new class
      NewClass[propName] = superClass[propName]
    })
  })

  // Copy static method names
  const staticMethodNames = Reflect.getMetadata(
    rtti.STATIC_METHODS,
    superClass
  ) as string[]
  Reflect.defineMetadata(rtti.STATIC_METHODS, staticMethodNames, NewClass)

  // Copy metadata of static methods (type, optionality, parameters etc.)
  staticMethodNames.forEach(methodName => {
    Reflect.getMetadataKeys(superClass, methodName).forEach(key => {
      const value = Reflect.getMetadata(key, superClass, methodName)
      Reflect.defineMetadata(key, value, NewClass, methodName)
      // Copy the value of the static method to the new class
      NewClass[methodName] = superClass[methodName]
    })
  })
}

export function getInstanceMemberNames<T extends Type<InstanceType<T>>>(
  clazz: T
) {
  return [
    ...Reflect.getMetadata(rtti.PROPS, clazz),
    ...Reflect.getMetadata(rtti.METHODS, clazz),
  ] as string[]
}

export function setOptionality<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T>
>(clazz: T, key: K & string, value: boolean) {
  let formatMetadata = Reflect.getMetadata(
    rtti.FORMAT,
    clazz.prototype,
    key
  ) as string
  formatMetadata = formatMetadata.replaceAll('?', '')
  if (value) formatMetadata += '?'
  Reflect.defineMetadata(rtti.FORMAT, formatMetadata, clazz.prototype, key)
}

export type OmitStatics<T> = T extends {
  new (...args: infer A): infer R
}
  ? { new (...args: A): R } & Omit<T, never>
  : never
