import * as ts from 'typescript'
import type { ReflectedObjectRef, ReflectedTypeRef } from 'typescript-rtti'
import type { RtType } from 'typescript-rtti/dist/common'
import Handlebars, { HelperOptions } from 'handlebars'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LiteralUnion } from '@/helpers/type-helpers'

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

export function createTypeNode(
  t?: ReflectedTypeRef<RtType>,
  options: { stripPromise: boolean } = { stripPromise: false }
): ts.TypeNode {
  if (t === undefined)
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  if (options.stripPromise && t.isPromise()) t = t.typeParameters[0]
  if (t.is('array')) {
    return ts.factory.createArrayTypeNode(createTypeNode(t.elementType))
  } else if (t.is('class')) {
    return ts.factory.createTypeReferenceNode(
      lowerCaseIfPrimitive(t.class.name),
      undefined
    )
  } else if (t.is('enum')) {
    // Todo: enum not working
    return ts.factory.createTypeReferenceNode(t.name, undefined)
  } else if (t.is('generic')) {
    return ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier(
        t.baseType.is('interface')
          ? t.baseType.as('interface').reflectedInterface.class.name
          : t.baseType.as('class').class.name
      ),
      t.typeParameters.map(tp => createTypeNode(tp))
    )
  } else if (t.is('interface')) {
    return ts.factory.createTypeReferenceNode(t.reflectedInterface.class.name)
  } else if (t.is('intersection')) {
    return ts.factory.createIntersectionTypeNode(
      t.types.map(t => createTypeNode(t))
    )
  } else if (t.is('literal')) {
    let literal!: ts.LiteralExpression | ts.TrueLiteral | ts.FalseLiteral
    if (t.isBigIntLiteral())
      // ! Big int literals not working
      throw 'BigInt literals are not supported yet'
    else if (t.isNumberLiteral())
      literal = ts.factory.createNumericLiteral(t.value)
    else if (t.isStringLiteral())
      literal = ts.factory.createStringLiteral(t.value)
    return ts.factory.createLiteralTypeNode(literal)
  } else if (t.isTrue())
    return ts.factory.createLiteralTypeNode(ts.factory.createTrue())
  else if (t.isFalse())
    return ts.factory.createLiteralTypeNode(ts.factory.createFalse())
  else if (t.is('tuple'))
    // ! Optional named tuple members are not working
    return ts.factory.createTupleTypeNode(
      t.elements.map(e => {
        if (e.name === undefined) return createTypeNode(e.type)
        else
          return ts.factory.createNamedTupleMember(
            undefined,
            ts.factory.createIdentifier(e.name),
            undefined,
            createTypeNode(e.type)
          )
      })
    )
  else if (t.is('union')) {
    return ts.factory.createUnionTypeNode(t.types.map(t => createTypeNode(t)))
  } else if (t.is('unknown')) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
  } else if (t.is('void')) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
  } else if (t.isUndefined()) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
  } else if (t.isNull()) {
    return ts.factory.createLiteralTypeNode(ts.factory.createNull())
  } else if (isObjectLiteral(t)) {
    // ! Index signatures are not supported
    return ts.factory.createTypeLiteralNode(
      t.members.map(m =>
        ts.factory.createPropertySignature(
          // ! Readonly properties are not supported
          m.flags.isReadonly
            ? [ts.factory.createToken(ts.SyntaxKind.ReadonlyKeyword)]
            : undefined,
          // !
          ts.factory.createIdentifier(m.name),
          m.isOptional
            ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
            : undefined,
          createTypeNode(m.type)
        )
      )
    )
  } else {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  }
}

export function printTS(nodes: readonly any[]) {
  const resultFile = ts.createSourceFile(
    'index.ts',
    '',
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ false,
    ts.ScriptKind.TS
  )
  // Creating the code
  const nodeArray = ts.factory.createNodeArray(nodes)
  const printer = ts.createPrinter()
  const code = printer.printList(
    ts.ListFormat.SourceFileStatements,
    nodeArray,
    resultFile
  )
  return code
}

export function generateUsingHbs(
  hbsTemplate: LiteralUnion<HbsTemplate>,
  outputPath: string,
  context: any,
  options?: Handlebars.RuntimeOptions
) {
  const templateFile = readFileSync(
    join(__dirname, 'templates', hbsTemplate + '.hbs'),
    {
      encoding: 'utf8',
    }
  )
  Handlebars.registerHelper('stringify', context => JSON.stringify(context))
  Handlebars.registerHelper(
    'ifNotEmpty',
    function (param, options: HelperOptions) {
      return param.length ? options.fn(this) : options.inverse(this)
    }
  )
  Handlebars.registerHelper(
    'ifDefined',
    function (param, options: HelperOptions) {
      return param !== undefined ? options.fn(this) : options.inverse(this)
    }
  )
  const template = Handlebars.compile(templateFile)
  const result = template(context, options)
  writeFileSync(outputPath, result, 'utf-8')
}

export function combineIntoObjectLiteral(
  structure: { name: string; type: ts.TypeNode; optional: boolean }[]
) {
  return ts.factory.createTypeLiteralNode(
    structure.map(({ name, type, optional }) =>
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createIdentifier(name),
        optional
          ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
          : undefined,
        type
      )
    )
  )
}

type HbsTemplate = 'api-generator'
