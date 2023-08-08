import { reflect } from 'typescript-rtti'
import 'reflect-metadata'

export class Model {
  static of<T extends object>(clazz: new () => T) {
    return new ModelOf(clazz)
  }
  static create<T extends object>(this: new () => T, obj: T): T {
    return ModelUtil.create(this, obj)
  }

  static createPartially<T extends object>(
    this: new () => T,
    obj: Partial<T>
  ): T {
    return ModelUtil.createPartially(this, obj)
  }

  static createFrom<T extends object, G extends T>(
    this: new () => T,
    obj: G
  ): T {
    return ModelUtil.narrowToClass(obj, this)
  }
}

class ModelOf<T extends object> {
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
export class ModelUtil {
  static narrowToClass<B extends S, S extends object>(
    bigClassInstance: B,
    smallClass: Class<S>
  ) {
    const smallClassInstance = new smallClass()
    const smallClassProps = reflect(smallClass).properties
    const smallClassMethods = reflect(smallClass).methods
    for (const prop of [...smallClassProps, ...smallClassMethods])
      if (!prop.isOptional || prop.name in bigClassInstance)
        smallClassInstance[prop.name] = bigClassInstance[prop.name]
    return smallClassInstance
  }

  static create<T extends object>(clazz: new () => T, obj: T): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }

  static createPartially<T extends object>(
    clazz: new () => T,
    obj: Partial<T>
  ): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }

  static createFrom<T extends object, G extends T>(
    clazz: new () => T,
    obj: G
  ): T {
    return ModelUtil.narrowToClass(obj, clazz)
  }
}

type Class<T> = { new (...args: any[]): T }
