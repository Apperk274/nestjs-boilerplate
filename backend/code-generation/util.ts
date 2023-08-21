import type { ReflectedObjectRef, ReflectedTypeRef } from 'typescript-rtti'
import type { RtType } from 'typescript-rtti/dist/common'

export function removeEach(code: string, searchValues: string[]) {
  for (const searchValue of searchValues) {
    code = code.replace(searchValue, '')
  }
  return code
}

export function lowerCaseIfPrimitive(name: string) {
  const primitives = ['Boolean', 'Number', 'String', 'BigInt']
  return primitives.includes(name) ? name.toLowerCase() : name
}

export function isObjectLiteral(
  t: ReflectedTypeRef<RtType>
): t is ReflectedObjectRef {
  return t.is('object' as any)
}

export function capitalizeDecorator(name: string) {
  const exceptions = { isLength: 'Length' }
  return exceptions[name] ?? name.charAt(0).toUpperCase() + name.slice(1)
}
