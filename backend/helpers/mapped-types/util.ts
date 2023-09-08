import { Type } from '@nestjs/common'
import { getMetadataStorage } from 'class-validator'
import { reflect } from 'typescript-rtti'

const rtti = {
  PROPS: 'rt:P',
  METHODS: 'rt:m',
  STATIC_PROPS: 'rt:SP',
  STATIC_METHODS: 'rt:Sm',
  TYPE: 'rt:t',
  FORMAT: 'rt:f',
} as const

export function copyClassData<T extends Type<InstanceType<T>>>(
  fromClass: T,
  toClass: Type,
  options: {
    excludedMembers: readonly string[]
  } = { excludedMembers: [] }
) {
  const tempFromInstance = new fromClass() as any
  // Copy instance property names
  const propNames = reflect(fromClass).propertyNames.filter(
    pN => !options.excludedMembers.includes(pN)
  )
  Reflect.defineMetadata(rtti.PROPS, propNames, toClass)

  // Copy metadata of instance properties (type, optionality, mutability etc.)
  propNames.forEach(propName => {
    Reflect.getMetadataKeys(fromClass.prototype, propName).forEach(key => {
      const value = Reflect.getMetadata(key, fromClass.prototype, propName)
      Reflect.defineMetadata(key, value, toClass.prototype, propName)
    })
  })
  // Copy the default value of the prop to the new class's instances
  propNames.forEach(propName => {
    if (propName in tempFromInstance) {
      toClass.prototype[propName] = tempFromInstance[propName]
    }
  })

  // Copy instance method names
  const methodNames = reflect(fromClass).methodNames.filter(
    mN => !options.excludedMembers.includes(mN)
  )
  Reflect.defineMetadata(rtti.METHODS, methodNames, toClass)

  // Copy metadata of instance methods (type, optionality, parameters etc.)
  methodNames.forEach(methodName => {
    Reflect.getMetadataKeys(fromClass.prototype, methodName).forEach(key => {
      const value = Reflect.getMetadata(key, fromClass.prototype, methodName)
      Reflect.defineMetadata(key, value, toClass.prototype, methodName)
    })
  })
  // Copy the default value of the method to the new class's instances
  methodNames.forEach(methodName => {
    toClass.prototype[methodName] = fromClass.prototype[methodName]
  })

  // Copy static property names
  const staticPropNames = reflect(fromClass).staticPropertyNames
  Reflect.defineMetadata(rtti.STATIC_PROPS, staticPropNames, toClass)

  // Copy metadata of static properties (type, optionality, mutability etc.)
  staticPropNames.forEach(propName => {
    Reflect.getMetadataKeys(fromClass, propName).forEach(key => {
      const value = Reflect.getMetadata(key, fromClass, propName)
      Reflect.defineMetadata(key, value, toClass, propName)
    })
  })
  // Copy the value of the static prop to the new class
  reflect(fromClass).staticPropertyNames.forEach(propName => {
    if (propName in fromClass) toClass[propName] = fromClass[propName]
  })

  // Copy static method names
  const staticMethodNames = reflect(fromClass).staticMethodNames
  Reflect.defineMetadata(rtti.STATIC_METHODS, staticMethodNames, toClass)

  // Copy metadata of static methods (type, optionality, parameters etc.)
  staticMethodNames.forEach(methodName => {
    Reflect.getMetadataKeys(fromClass, methodName).forEach(key => {
      const value = Reflect.getMetadata(key, fromClass, methodName)
      Reflect.defineMetadata(key, value, toClass, methodName)
    })
  })
  // Copy the values of the static methods to the new class
  reflect(fromClass).staticMethodNames.forEach(methodName => {
    toClass[methodName] = fromClass[methodName]
  })

  // Copy validators
  const validationMetadatas = getMetadataStorage().getTargetValidationMetadatas(
    fromClass,
    '',
    false,
    false
  )
  validationMetadatas.forEach(vMD =>
    getMetadataStorage().addValidationMetadata({ ...vMD, target: toClass })
  )
}

export function getOwnInstanceMemberNames<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T) {
  return [
    ...Reflect.getMetadata(rtti.PROPS, clazz),
    ...Reflect.getMetadata(rtti.METHODS, clazz),
  ] as K[]
}

export function getInstanceMemberNames<
  T extends Type<InstanceType<T>>,
  K extends keyof InstanceType<T> & string
>(clazz: T) {
  return [...reflect(clazz).propertyNames, ...reflect(clazz).methodNames] as K[]
}

export function setOptionality<T extends Type<InstanceType<T>>>(
  clazz: T,
  key: string,
  value: boolean
) {
  let formatMetadata = Reflect.getMetadata(
    rtti.FORMAT,
    clazz.prototype,
    key
  ) as string
  formatMetadata = formatMetadata.replaceAll('?', '')
  if (value) formatMetadata += '?'
  Reflect.defineMetadata(rtti.FORMAT, formatMetadata, clazz.prototype, key)
}

export function performRecursively<T extends Type>(
  clazz: T,
  operation: (clazz: T) => any
) {
  // Check if reached the end of classes by any rtti metadata key
  if (!Reflect.getMetadataKeys(clazz).includes(rtti.PROPS)) return
  // Run operation
  operation(clazz)
  // Continue on super class
  performRecursively(
    Object.getPrototypeOf(clazz.prototype).constructor,
    operation
  )
}
