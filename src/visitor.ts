import * as ts from 'typescript'

function createAssertNumCall (identifier: string) {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('assertIsNumber'),
    undefined,
    [ts.createIdentifier(identifier)],
  ))
}

function createAssertStringCall (identifier: string): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('assertIsString'),
    undefined,
    [ts.createIdentifier(identifier)],
  ))
}

function isExpressionStatement (candidate: ts.ExpressionStatement | null): candidate is ts.ExpressionStatement {
  return !!candidate
}

export function createVisitor () {
  function visitor (ctx: ts.TransformationContext, sf: ts.SourceFile) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      if (ts.isFunctionDeclaration(node) && node.body && !(node.name && node.name.text.startsWith('assert'))) {
        const assertCalls = node.parameters
          .map(parameter => {
            if (parameter.type && parameter.type.kind === ts.SyntaxKind.NumberKeyword) {
              return createAssertNumCall(parameter.name.getText())
            }
            if (parameter.type && parameter.type.kind === ts.SyntaxKind.StringKeyword) {
              return createAssertStringCall(parameter.name.getText())
            }
            return null
          })
          .filter(isExpressionStatement)
        const newBody = ts.createBlock([
          ...assertCalls,
          ...node.body.statements
        ], true)
        return ts.updateFunctionDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          newBody,
        )
      } else {
        return ts.visitEachChild(node, visitor, ctx)
      }
    }
    return visitor
  }

  return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf))
  }
}