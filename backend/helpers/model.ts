import { reflect } from 'typescript-rtti'
import 'reflect-metadata'

export class Model {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}
  static of<T extends object>(clazz: new () => T) {
    return new ModelOf(clazz)
  }
  static create<T extends object>(this: new () => T, obj: T): T {
    return ModelUtil.create(this, obj)
  }

  static createPartial<T extends object>(
    this: new () => T,
    obj: Partial<T>
  ): T {
    return ModelUtil.createPartial(this, obj)
  }

  static from<T extends object, G extends T>(this: new () => T, obj: G): T {
    return ModelUtil.from(this, obj)
  }

  static fromMany<T extends object, G extends T>(
    this: new () => T,
    objs: G[]
  ): T[] {
    return ModelUtil.fromMany(this, objs)
  }
}

class ModelOf<T extends object> {
  constructor(private clazz: Class<T>) {}
  create(obj: T): T {
    return ModelUtil.create(this.clazz, obj)
  }

  createPartial(obj: Partial<T>): T {
    return ModelUtil.createPartial(this.clazz, obj)
  }

  from<G extends T>(obj: G): T {
    return ModelUtil.from(this.clazz, obj)
  }

  fromMany<G extends T>(objs: G[]): T[] {
    return ModelUtil.fromMany(this.clazz, objs)
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
      instance[key] = obj[key]
    })
    return instance
  }

  static createPartial<T extends object>(
    clazz: new () => T,
    obj: Partial<T>
  ): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      instance[key] = obj[key]
    })
    return instance
  }

  static from<T extends object, G extends T>(clazz: new () => T, obj: G): T {
    return ModelUtil.narrowToClass(obj, clazz)
  }

  static fromMany<T extends object, G extends T>(
    clazz: new () => T,
    objs: G[]
  ) {
    return objs.map(obj => ModelUtil.from(clazz, obj))
  }
}

type Class<T> = { new (...args: any[]): T }
