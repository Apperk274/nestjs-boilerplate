import { globSync } from 'glob'
import { Paramtype, RequestMethod, Type } from '@nestjs/common'
import * as ts from 'typescript'
import { reflect } from 'typescript-rtti'
import { readFileSync } from 'fs'
import { createTypeNode, printTS } from '@/code-generation/util'

const paramTypes = ['Body', 'Query', 'Param']

export async function generateApis() {
  const classPaths = globSync('./backend/**/*.controller.ts').map(e =>
    e.replace('backend\\', '..\\').replace('.ts', '').replaceAll('\\', '/')
  )
  for (const classPath of classPaths) {
    const classesAtPath: Record<string, Type> = await import(classPath)
    for (const className in classesAtPath) {
      const clazz = classesAtPath[className]
      const reflectedClazz = reflect(clazz)
      const path = addLeading(reflectedClazz.getMetadata('path'), '/')
      const sourceFile = ts.createSourceFile(
        '',
        readFileSync('./backend/code-generation/' + classPath + '.ts', 'utf-8'),
        ts.ScriptTarget.Latest,
        true
      )
      const endpoints = getEndpoints(sourceFile)
      for (const endpoint of endpoints) {
        const returnType = reflectedClazz.methods.find(
          m => m.name === endpoint.name
        )?.returnType
        endpoint.returnType = printTS([
          createTypeNode(returnType, { stripPromise: true }),
        ])
      }
      console.log(path, endpoints)
    }
  }
}

function getEndpoints(node: ts.Node) {
  const endpoints: Endpoint[] = []
  if (ts.isClassDeclaration(node)) {
    for (const method of node.members) {
      if (
        ts.isMethodDeclaration(method) &&
        !(
          ts.getCombinedModifierFlags(method) &
          ts.ModifierFlags.Static &
          ts.ModifierFlags.Public
        )
      ) {
        const methodDecorators = ts.getDecorators(method)
        if (!methodDecorators) continue
        const methodDecoratorExpr = methodDecorators.find(
          d =>
            ts.isCallExpression(d.expression) &&
            d.expression.expression.getText().toUpperCase() in RequestMethod
        )?.expression as ts.CallExpression
        if (!methodDecoratorExpr) continue
        const requestMethod =
          RequestMethod[methodDecoratorExpr.expression.getText().toUpperCase()]
        const methodPath =
          (methodDecoratorExpr.arguments[0] as ts.StringLiteral)?.text || ''
        const name = method.name.getText()
        const parameters: EndpointParam[] = []
        for (const parameter of method.parameters) {
          const paramName = parameter.name.getText()
          const type = parameter.type ? parameter.type.getText() : 'any'
          const paramDecorators = ts.getDecorators(parameter)
          if (!paramDecorators) continue
          const paramDecoratorExpr = paramDecorators.find(
            d =>
              ts.isCallExpression(d.expression) &&
              paramTypes.includes(d.expression.expression.getText())
          )?.expression as ts.CallExpression
          if (!paramDecoratorExpr) continue
          const paramType = paramDecoratorExpr.expression
            .getText()
            .toLowerCase() as Paramtype
          const endpointParam: EndpointParam = {
            name: paramName,
            paramType: paramType,
            type: type,
            arguments: paramDecoratorExpr.arguments
              .filter(a => ts.isStringLiteral(a))
              .map((a: ts.StringLiteral) => a.text),
          }
          parameters.push(endpointParam)
        }
        const endpoint: Endpoint = {
          name,
          path: methodPath,
          parameters,
          requestMethod,
          returnType: 'any',
        }
        endpoints.push(endpoint)
      }
    }
  }
  ts.forEachChild(node, childNode => {
    endpoints.push(...getEndpoints(childNode))
  })
  return endpoints
}

function addLeading(input: string, leadingPart: string): string {
  return input.startsWith(leadingPart) ? input : leadingPart + input
}

interface EndpointParam {
  name: string
  paramType: Paramtype
  type: string
  arguments: string[]
}

interface Endpoint {
  name: string
  path: string
  requestMethod: RequestMethod
  parameters: EndpointParam[]
  returnType: string
}
