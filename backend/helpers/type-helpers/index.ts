export type OmitStatics<T> = T extends {
  new (...args: infer A): infer R
}
  ? { new (...args: A): R } & Omit<T, never>
  : never

export type MakeInstanceRequired<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Required<InstanceType<T>> }

export type MakeInstancePartial<T extends new (...args: any[]) => any> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Partial<InstanceType<T>> }

export type PickKeysForInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Pick<InstanceType<T>, K> }

export type RemoveKeysFromInstance<
  T extends new (...args: any[]) => any,
  K extends keyof InstanceType<T>
> = {
  [P in keyof T]: T[P]
} & { new (...args: any[]): Omit<InstanceType<T>, K> }

export type * from 'prettier'
