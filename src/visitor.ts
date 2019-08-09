import * as ts from 'typescript'

function createCheckNumCall (identifier: string) {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkNumber'),
    undefined,
    [ts.createIdentifier(identifier), ts.createStringLiteral(identifier)],
  ))
}

function createCheckStringCall (identifier: string): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkString'),
    undefined,
    [ts.createIdentifier(identifier), ts.createStringLiteral(identifier)],
  ))
}

function createCheckUnionCall (checks: ts.ExpressionStatement[], identifier: string): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkUnion'),
    undefined,
    [ts.createArrayLiteral(checks.map(statement => statement.expression), true), ts.createStringLiteral(identifier)],
  ))
}

function createAssertTypeCall(checks: ts.ExpressionStatement[]): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('assertType'),
    undefined,
    [ts.createArrayLiteral(checks.map(statement => statement.expression), true)],
  ))
}

function isExpressionStatement (candidate: ts.ExpressionStatement | null): candidate is ts.ExpressionStatement {
  return !!candidate
}

function hasValidateComment (sf: ts.SourceFile, node: ts.Node): boolean {
  const commentRanges = ts.getLeadingCommentRanges(sf.getText(), node.getFullStart())
  return commentRanges !== undefined && commentRanges.some(commentRange => {
    const commentText = sf.getText().substring(commentRange.pos, commentRange.end)
    return /@validate/.test(commentText)
  })
}

function createAssertCallsForType (typeChecker: ts.TypeChecker,
                                    accessor: string,
                                    type?: ts.Type): ts.ExpressionStatement[] {
  if (!type) {
    return []
  }
  if (type.getFlags() & ts.TypeFlags.Number) {
    return [createCheckNumCall(accessor)]
  }
  if (type.getFlags() & ts.TypeFlags.String) {
    return [createCheckStringCall(accessor)]
  }
  if (type.isUnion()) {
    return [createCheckUnionCall(type.types
      .map(type => createAssertCallsForType(typeChecker, accessor, type))
      .flat(), accessor)]
  }
  if (type.isClassOrInterface()) {
    const props = typeChecker.getPropertiesOfType(type)
    return props.map(prop => {
      const declaration = prop.declarations[0]
      if (declaration && ts.isPropertySignature(declaration)) {
        return createAssertCallsForType(typeChecker,
          `${accessor}.${prop.getName()}`,
          typeChecker.getTypeAtLocation(declaration))
      }
      return []
    })
      .flat()
  }
  return []
}

export function createVisitor (typeChecker: ts.TypeChecker) {
  function visitor (ctx: ts.TransformationContext, sf: ts.SourceFile) {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      if (ts.isFunctionDeclaration(node) && node.body && hasValidateComment(sf, node)) {
        const assertCalls = node.parameters
          .map(parameter => {
            return createAssertCallsForType(typeChecker, parameter.name.getText(), typeChecker.getTypeAtLocation(parameter))
          })
          .flat()
        const newBody = ts.createBlock([
          createAssertTypeCall(assertCalls),
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