/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { globSync } from 'glob'
import type { Type } from '@nestjs/common'
import * as ts from 'typescript'
import {
  type ReflectedProperty,
  reflect,
  ReflectedTypeRef,
  ReflectedObjectRef,
} from 'typescript-rtti'
import { getMetadataStorage } from 'class-validator'
import { RtType } from 'typescript-rtti/dist/common'
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import { copyFileSync, writeFileSync } from 'fs'

export async function generateModels() {
  const classPaths = globSync('./backend/resources/**/*.dto.ts').map(e =>
    e.replace('backend\\', '..\\').replace('.ts', '').replaceAll('\\', '/')
  )
  const validatorsToImport = new Set<string>(['IsOptional'])
  const classDeclarations: ts.ClassDeclaration[] = []
  for (const classPath of classPaths) {
    const classesAtPath: Record<string, Type> = await import(classPath)
    for (const className in classesAtPath) {
      const clazz = classesAtPath[className]
      const props = [
        ...reflect(clazz).properties,
        ...reflect(clazz).staticProperties,
      ]
      const validationMetadata =
        getMetadataStorage().getTargetValidationMetadatas(
          clazz,
          '',
          false,
          false
        )
      validationMetadata.forEach(vmd => {
        validatorsToImport.add(capitalizeDecorator(vmd.name!))
      })
      const classDeclaration = ts.factory.createClassDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(className),
        undefined,
        [
          ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
            ts.factory.createExpressionWithTypeArguments(
              ts.factory.createIdentifier('Model'),
              undefined
            ),
          ]),
        ],
        props.map(p =>
          createPropertyDeclaration(
            p,
            clazz,
            validationMetadata.filter(vmd => vmd.propertyName === p.name)!
          )
        )
      )
      classDeclarations.push(classDeclaration)
    }
  }
  // Combining class declarations
  const resultFile = ts.createSourceFile(
    'someFileName.ts',
    '',
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ false,
    ts.ScriptKind.TS
  )
  // Creating validator imports
  const validatorsImportDeclaration = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports(
        Array.from(validatorsToImport).map(v =>
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(v)
          )
        )
      )
    ),
    ts.factory.createStringLiteral('class-validator'),
    undefined
  )
  // Creating other imports
  const otherImports = createImports([
    { path: './model', namedImports: ['Model'] },
  ])
  // Creating the code
  const nodeArray = ts.factory.createNodeArray([
    validatorsImportDeclaration,
    ...otherImports,
    ...classDeclarations,
  ])
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.CarriageReturnLineFeed,
  })
  const code = printer.printList(
    ts.ListFormat.SourceFileStatements,
    nodeArray,
    resultFile
  )
  // Writing everything in a file
  writeFileSync('./frontend/src/models/index.ts', code, 'utf-8')
  // Copying Model file
  copyFileSync('./backend/helpers/model.ts', './frontend/src/models/model.ts')
}

function createPropertyDeclaration(
  p: ReflectedProperty,
  C: Type,
  vs: ValidationMetadata[]
) {
  const instance = new C()
  const propertyType = createTypeNode(p.type)
  return ts.factory.createPropertyDeclaration(
    [
      ...addValidatorIfOptional(p),
      ...vs.map(v =>
        ts.factory.createDecorator(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(capitalizeDecorator(v.name!)),
            undefined,
            v.constraints?.map(c =>
              ts.factory.createIdentifier(c.toString())
            ) ?? []
          )
        )
      ),
      ...(p.isMarkedPublic
        ? [ts.factory.createToken(ts.SyntaxKind.PublicKeyword)]
        : []),
      ...(p.isPrivate
        ? [ts.factory.createToken(ts.SyntaxKind.PrivateKeyword)]
        : []),
      ...(p.isProtected
        ? [ts.factory.createToken(ts.SyntaxKind.PrivateKeyword)]
        : []),
      ...(p.isStatic
        ? [ts.factory.createToken(ts.SyntaxKind.StaticKeyword)]
        : []),
      ...(p.isReadonly
        ? [ts.factory.createToken(ts.SyntaxKind.ReadonlyKeyword)]
        : []),
    ],
    ts.factory.createIdentifier(p.name),
    p.isOptional
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,
    propertyType,
    p.name in instance
      ? ts.factory.createNumericLiteral(instance[p.name])
      : undefined
  )
}

function createTypeNode(t: ReflectedTypeRef<RtType>): ts.TypeNode {
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

function lowerCaseIfPrimitive(name: string) {
  const primitives = ['Boolean', 'Number', 'String', 'BigInt']
  return primitives.includes(name) ? name.toLowerCase() : name
}

function isObjectLiteral(t: ReflectedTypeRef<RtType>): t is ReflectedObjectRef {
  return t.is('object' as any)
}

function capitalizeDecorator(name: string) {
  const exceptions = { isLength: 'Length' }
  return exceptions[name] ?? name.charAt(0).toUpperCase() + name.slice(1)
}

function addValidatorIfOptional(p: ReflectedProperty) {
  return p.isOptional
    ? [
        ts.factory.createDecorator(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('IsOptional'),
            undefined,
            []
          )
        ),
      ]
    : []
}

type Imports = {
  path: string
  defaultImport?: string
  namedImports?: string[]
}[]

function createImports(imports: Imports) {
  return imports.map(i =>
    ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        i.defaultImport === undefined
          ? undefined
          : ts.factory.createIdentifier(i.defaultImport),
        i.namedImports === undefined
          ? undefined
          : ts.factory.createNamedImports(
              i.namedImports.map(ni =>
                ts.factory.createImportSpecifier(
                  false,
                  undefined,
                  ts.factory.createIdentifier(ni)
                )
              )
            )
      ),
      ts.factory.createStringLiteral(i.path)
    )
  )
}
