import { globSync } from 'glob'
import { Paramtype, Type } from '@nestjs/common'
import * as ts from 'typescript'
import { reflect } from 'typescript-rtti'
import { readFileSync } from 'fs'
import {
  combineIntoObjectLiteral,
  createTypeNode,
  generateUsingHbs,
  printTS,
} from '@/code-generation/util'
import { join } from 'path'

const paramTypes = ['Body', 'Query', 'Param']

export async function generateApis() {
  const controllers: Controller[] = []
  const classPaths = globSync('./backend/**/*.controller.ts').map(e =>
    e.replace('backend\\', '..\\').replace('.ts', '').replaceAll('\\', '/')
  )
  for (const classPath of classPaths) {
    const classesAtPath: Record<string, Type> = await import(classPath)
    for (const className in classesAtPath) {
      const clazz = classesAtPath[className]
      const reflectedClazz = reflect(clazz)
      const controllerPath = addLeading(reflectedClazz.getMetadata('path'), '/')
      const sourceFile = ts.createSourceFile(
        '',
        readFileSync('./backend/code-generation/' + classPath + '.ts', 'utf-8'),
        ts.ScriptTarget.Latest,
        true
      )
      const endpoints = getEndpoints(sourceFile, controllerPath)
      for (const endpoint of endpoints) {
        const returnType = reflectedClazz.methods.find(
          m => m.name === endpoint.name
        )?.returnType
        endpoint.returnType = printTS([
          createTypeNode(returnType, { stripPromise: true }),
        ])
      }
      controllers.push({
        name: className.replace('Controller', '').toLowerCase(),
        endpoints,
      })
    }
  }
  // console.log(JSON.stringify(controllers, undefined, 2))
  generateUsingHbs('api-generator', './frontend/src/apis/index.ts', {
    controllers,
  })
}

function getEndpoints(node: ts.Node, controllerPath: string) {
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
        // Endpoint
        const methodDecorators = ts.getDecorators(method)
        if (!methodDecorators) continue
        const methodDecoratorExpr = methodDecorators.find(
          d =>
            ts.isCallExpression(d.expression) &&
            d.expression.expression.getText().toUpperCase() in RequestMethod
        )?.expression as ts.CallExpression
        if (!methodDecoratorExpr) continue
        const requestMethod = methodDecoratorExpr.expression
          .getText()
          .toUpperCase() as RequestMethod
        const methodPath =
          (methodDecoratorExpr.arguments[0] as ts.StringLiteral)?.text || ''
        const name = method.name.getText()
        const endpointParams: EndpointParam[] = []
        for (const parameter of method.parameters) {
          // Endpoint Parameters
          const paramDecorators = ts.getDecorators(parameter)
          if (!paramDecorators) continue
          const paramDecoratorExpr = paramDecorators.find(
            d =>
              ts.isCallExpression(d.expression) &&
              paramTypes.includes(d.expression.expression.getText())
          )?.expression as ts.CallExpression
          if (!paramDecoratorExpr) continue
          const name: string | undefined = paramDecoratorExpr.arguments
            .filter(a => ts.isStringLiteral(a))
            .map((a: ts.StringLiteral) => a.text)[0]
          const type =
            parameter.type ??
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
          const paramType = paramDecoratorExpr.expression
            .getText()
            .toLowerCase() as Paramtype
          const endpointParam: EndpointParam = {
            name,
            type,
            paramType,
          }
          endpointParams.push(endpointParam)
        }
        const paramData = {
          body: endpointParams.filter(ep => ep.paramType === 'body'),
          param: endpointParams.filter(ep => ep.paramType === 'param'),
          query: endpointParams.filter(ep => ep.paramType === 'query'),
        }
        if (
          Object.values(paramData).some(
            p => p.some(bp => !bp.name) && p.length > 1
          )
        ) {
          throw new Error('Incompatible parameter types on endpoint ' + name)
        }
        const params: EndpointParams = {
          body: undefined,
          param: undefined,
          query: undefined,
        }
        for (const paramType in params) {
          if (paramData[paramType].length) {
            if (
              paramData[paramType].length === 1 &&
              !paramData[paramType][0].name
            )
              params[paramType] = printTS([paramData[paramType][0].type])
            else
              params[paramType] = printTS([
                combineIntoObjectLiteral(
                  paramData[paramType].map((pp: EndpointParam) => ({
                    name: pp.name!,
                    optional: false,
                    type: pp.type,
                  }))
                ),
              ])
          }
        }
        const endpoint: Endpoint = {
          name,
          path: join(controllerPath, methodPath),
          params,
          requestMethod,
          returnType: 'any',
        }
        endpoints.push(endpoint)
      }
    }
  }
  ts.forEachChild(node, childNode => {
    endpoints.push(...getEndpoints(childNode, controllerPath))
  })
  return endpoints
}

function addLeading(input: string, leadingPart: string): string {
  return input.startsWith(leadingPart) ? input : leadingPart + input
}

interface EndpointParam {
  name?: string
  type: ts.TypeNode
  paramType: Paramtype
}

type EndpointParams = Partial<Record<Paramtype, string>>

interface Endpoint {
  name: string
  path: string
  requestMethod: RequestMethod
  params: EndpointParams
  returnType: string
}

interface Controller {
  name: string
  endpoints: Endpoint[]
}

enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}
