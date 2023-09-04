/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { globSync } from 'glob'
import type { Type } from '@nestjs/common'
import * as ts from 'typescript'
import { type ReflectedProperty, reflect } from 'typescript-rtti'
import { getMetadataStorage } from 'class-validator'
import type { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'
import {
  capitalizeDecorator,
  createTypeNode,
  printTS,
  removeEach,
} from '@/code-generation/util'

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
    'index.ts',
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
  const code = printTS([
    validatorsImportDeclaration,
    ...otherImports,
    ...classDeclarations,
  ])
  // Writing everything in a file
  writeFileSync('./frontend/src/models/index.ts', code, 'utf-8')
  // Copying Model file
  copyFileSync('./backend/helpers/model.ts', './frontend/src/models/model.ts')
  // Creating model class file
  createModelClassFile()
}

function createModelClassFile() {
  const sourceFilePath = './backend/helpers/model.ts'
  const outputFilePath = './frontend/src/models/model.ts'
  const sourceCode = readFileSync(sourceFilePath, 'utf-8')
  const sourceFile = ts.createSourceFile(
    'model.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  )
  const importSt1 = sourceFile.getChildAt(0).getChildAt(0).getFullText() // import { reflect } from 'typescript-rtti'
  const importSt2 = sourceFile.getChildAt(0).getChildAt(1).getFullText() // import 'reflect-metadata'
  const codeWithoutImports = sourceCode
    .replace(importSt1, '')
    .replace(importSt2, '')
  const modelBody = sourceFile.getChildAt(0).getChildAt(2).getChildAt(4)
  const modelOfBody = sourceFile.getChildAt(0).getChildAt(3).getChildAt(6)
  const modelUtilBody = sourceFile.getChildAt(0).getChildAt(4).getChildAt(4)
  const modelFrom = modelBody.getChildAt(3).getFullText()
  const modelFromMany = modelBody.getChildAt(4).getFullText()
  const modelOfFrom = modelOfBody.getChildAt(3).getFullText()
  const modelOfFromMany = modelOfBody.getChildAt(4).getFullText()
  const modelUtilNarrow = modelUtilBody.getChildAt(0).getFullText()
  const modelUtilFrom = modelUtilBody.getChildAt(3).getFullText()
  const modelUtilFromMany = modelUtilBody.getChildAt(4).getFullText()
  const codesToRemove = [
    modelFrom,
    modelFromMany,
    modelOfFrom,
    modelOfFromMany,
    modelUtilNarrow,
    modelUtilFrom,
    modelUtilFromMany,
  ]
  const finalCode = removeEach(codeWithoutImports, codesToRemove)
  writeFileSync(outputFilePath, finalCode, 'utf-8')
}

/** @rtti:skip */
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
