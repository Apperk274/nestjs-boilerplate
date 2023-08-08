export type OmitStatics<T> = T extends {
  new (...args: infer A): infer R
}
  ? { new (...args: A): R } & Omit<T, never>
  : never
