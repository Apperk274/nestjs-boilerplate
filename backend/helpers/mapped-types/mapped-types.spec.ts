import { OmitType } from '@backend/helpers/mapped-types/omit-type'
import { reflect } from 'typescript-rtti'
import 'reflect-metadata'

describe('mapped-types', () => {
  class ClassX {
    // Instance props without default values
    a: string
    b: string
    // Instance props with default values
    c = 'test c'
    d = 'test d'
    // Static prop without default value
    static sA: string
    // Static prop with default value
    static sB = 'test sB'
    // Instance methods
    j(p: string) {
      return 'Hello j, ' + p
    }
    k(p: string) {
      return 'Hello k, ' + p
    }
    // Static method
    static sJ(p: string) {
      return 'Hello sJ, ' + p
    }
  }

  describe('two-classes', () => {
    describe('omit-type', () => {
      class ClassY extends OmitType(ClassX, ['a', 'c', 'j']) {
        // Instance prop without default value
        e: string
        // Instance prop with default value
        f = 'test f'
        // Static prop without default value
        static sC: string
        // Static prop with default value
        static sD = 'test sD'
        // Instance method
        l(p: string) {
          return 'Hello l, ' + p
        }
        // Static method
        static sK(p: string) {
          return 'Hello sK, ' + p
        }
      }
      const y = new ClassY()

      test.only('instance props', () => {
        expect(reflect(ClassY).propertyNames).toEqual(['b', 'd', 'e', 'f'])
        expect(reflect(ClassY).ownPropertyNames).toEqual(['e', 'f'])
        expect(y).not.toHaveProperty('a') // Omitted and no default value
        expect(y).not.toHaveProperty('b') // No default value
        expect(y).not.toHaveProperty('c') // Omitted
        expect(y.d).toBe('test d')
        expect(y).not.toHaveProperty('e') // No default value
        expect(y.f).toBe('test f')
      })

      test('instance methods', () => {
        expect(reflect(ClassY).methodNames).toEqual(['k', 'l'])
        expect(reflect(ClassY).ownMethodNames).toEqual(['l'])
        expect(y).not.toHaveProperty('j')
        expect(y.k('test')).toBe('Hello k, test')
        expect(y.l('test')).toBe('Hello l, test')
      })

      test('static props', () => {
        expect(reflect(ClassY).staticPropertyNames).toEqual(['sA', 'sB', 'sC', 'sD'])
        expect(reflect(ClassY).ownStaticPropertyNames).toEqual(['sC', 'sD'])
        expect(ClassY).not.toHaveProperty('sA') // No default value
        expect(ClassY.sB).toBe('test sB')
        expect(ClassY).not.toHaveProperty('sC') // No default value
        expect(ClassY.sD).toBe('test sD')
      })

      test('static methods', () => {
        expect(reflect(ClassY).staticMethodNames).toEqual(['sJ', 'sK'])
        expect(reflect(ClassY).ownStaticMethodNames).toEqual(['sK'])
        expect(ClassY.sJ('test')).toBe('Hello sJ, test')
        expect(ClassY.sK('test')).toBe('Hello sK, test')
      })
    })
  })
  describe('more-classes', () => {
    describe('omit-type', () => {
      class ClassY extends ClassX {
        // Instance props without default values
        e: string
        f: string
        // Instance props with default values
        g = 'test g'
        h = 'test h'
        // Static prop without default value
        static sC: string
        // Static prop with default value
        static sD = 'test sD'
        // Instance methods
        l(p: string) {
          return 'Hello l, ' + p
        }
        m(p: string) {
          return 'Hello m, ' + p
        }
        // Static method
        static sK(p: string) {
          return 'Hello sK, ' + p
        }
      }
      class ClassZ extends OmitType(ClassY, ['a', 'c', 'j', 'e', 'g', 'l']) {
        // Instance prop without default value
        i: string
        // Instance prop with default value
        ii = 'test ii'
        // Static prop without default value
        static sE: string
        // Static prop with default value
        static sF = 'test sF'
        // Instance method with default value
        n(p: string) {
          return 'Hello n, ' + p
        }
        // Static method
        static sL(p: string) {
          return 'Hello sL, ' + p
        }
      }
      const z = new ClassZ()

      test('instance props', () => {
        expect(reflect(ClassZ).propertyNames).toEqual(['b', 'd', 'f', 'h', 'i', 'ii'])
        expect(reflect(ClassZ).ownPropertyNames).toEqual(['i', 'ii'])
        expect(z).not.toHaveProperty('a') // Omitted and no default value
        expect(z).not.toHaveProperty('b') // No default value
        expect(z).not.toHaveProperty('c') // Omitted
        expect(z.d).toBe('test d')
        expect(z).not.toHaveProperty('e') // Omitted and No default value
        expect(z).not.toHaveProperty('f') // No default value
        expect(z).not.toHaveProperty('g') // Omitted
        expect(z.h).toBe('test h')
        expect(z).not.toHaveProperty('i') // No default value
        expect(z.ii).toBe('test ii')
      })

      test('instance methods', () => {
        expect(reflect(ClassZ).methodNames).toEqual(['k', 'm', 'n'])
        expect(reflect(ClassZ).ownMethodNames).toEqual(['n'])
        expect(z).not.toHaveProperty('j')
        expect(z.k('test')).toBe('Hello k, test')
        expect(z).not.toHaveProperty('l')
        expect(z.m('test')).toBe('Hello m, test')
        expect(z.n('test')).toBe('Hello n, test')
      })

      test('static props', () => {
        expect(reflect(ClassZ).staticPropertyNames).toEqual(['sA', 'sB', 'sC', 'sD', 'sE', 'sF'])
        expect(reflect(ClassZ).ownStaticPropertyNames).toEqual(['sE', 'sF'])
        expect(ClassZ).not.toHaveProperty('sA') // No default value
        expect(ClassZ.sB).toBe('test sB')
        expect(ClassZ).not.toHaveProperty('sC') // No default value
        expect(ClassZ.sD).toBe('test sD')
        expect(ClassZ).not.toHaveProperty('sE') // No default value
        expect(ClassZ.sF).toBe('test sF')
      })

      test('static methods', () => {
        expect(reflect(ClassZ).staticMethodNames).toEqual(['sJ', 'sK', 'sL'])
        expect(reflect(ClassZ).ownStaticMethodNames).toEqual(['sL'])
        expect(ClassZ.sJ('test')).toBe('Hello sJ, test')
        expect(ClassZ.sK('test')).toBe('Hello sK, test')
        expect(ClassZ.sL('test')).toBe('Hello sL, test')
      })
    })
  })
})
