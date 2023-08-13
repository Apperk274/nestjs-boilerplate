import { OmitType } from '@backend/helpers/mapped-types/omit-type'
import { reflect } from 'typescript-rtti'
import 'reflect-metadata'

describe('omit-type', () => {
  class X {
    a: string
    b: number
  }
  class Y extends OmitType(X, ['a']) {
    c: boolean
  }
  it('works correctly with props', () => {
    expect(reflect(Y).propertyNames).toEqual(['b', 'c'])
  })
})

// class X {
//   a: string
//   b?: number
//   x() {
//     console.log('x cagirildi')
//   }
//   static sA: string
//   static sX(p1: string, p2: number, p3: Cat) {
//     console.log('static x cagirildi', p1, p2, p3)
//   }
// }
// class Y extends PartialType(X) {
//   c: string
// }
