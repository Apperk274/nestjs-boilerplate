import { reflect } from 'typescript-rtti'
import 'reflect-metadata'

export class Model {
  static of<T>(clazz: new () => T) {
    return new ModelOf(clazz)
  }
  static create<T>(this: new () => T, obj: T): T {
    return ModelUtil.create(this, obj)
  }

  static createPartially<T>(this: new () => T, obj: Partial<T>): T {
    return ModelUtil.createPartially(this, obj)
  }

  static createFrom<T, G extends T>(this: new () => T, obj: G): T {
    return ModelUtil.narrowToClass(obj, this)
  }
}

class ModelOf<T> {
  constructor(private clazz: Class<T>) {}
  create(obj: T): T {
    return ModelUtil.create(this.clazz, obj)
  }

  createPartially(obj: Partial<T>): T {
    return ModelUtil.createPartially(this.clazz, obj)
  }

  createFrom<G extends T>(obj: G): T {
    return ModelUtil.narrowToClass(obj, this.clazz)
  }
}

type Class<T> = { new (...args: any[]): T }

export class ModelUtil {
  static narrowToClass<B extends S, S>(
    bigClassInstance: B,
    smallClass: Class<S>
  ) {
    const smallClassInstance = new smallClass()
    const smallClassPropertyNames = reflect(smallClass).propertyNames
    console.log(smallClassPropertyNames)
    for (const key of smallClassPropertyNames) {
      smallClassInstance[key as keyof S] = bigClassInstance[
        key as keyof B
      ] as any
    }
    return smallClassInstance
  }

  static create<T>(clazz: new () => T, obj: T): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }

  static createPartially<T>(clazz: new () => T, obj: Partial<T>): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }

  static createFrom<T, G extends T>(clazz: new () => T, obj: G): T {
    return ModelUtil.narrowToClass(obj, clazz)
  }
}
