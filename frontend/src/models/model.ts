

export class Model {
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
}

class ModelOf<T extends object> {
  constructor(private clazz: Class<T>) {}
  create(obj: T): T {
    return ModelUtil.create(this.clazz, obj)
  }

  createPartial(obj: Partial<T>): T {
    return ModelUtil.createPartial(this.clazz, obj)
  }
}
export class ModelUtil {

  static create<T extends object>(clazz: new () => T, obj: T): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }

  static createPartial<T extends object>(
    clazz: new () => T,
    obj: Partial<T>
  ): T {
    const instance = new clazz()
    Object.keys(obj).forEach(key => {
      ;(instance as any)[key] = (obj as any)[key]
    })
    return instance
  }
}

type Class<T> = { new (...args: any[]): T }
