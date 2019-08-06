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

function hasValidateComment (sf: ts.SourceFile, node: ts.Node): boolean {
  const commentRanges = ts.getLeadingCommentRanges(sf.getText(), node.getFullStart())
  return commentRanges !== undefined && commentRanges.some(commentRange => {
    const commentText = sf.getText().substring(commentRange.pos, commentRange.end)
    return /@validate/.test(commentText)
  })
}

function createAssertCallsForType (typeChecker: ts.TypeChecker,
                                   accessor: string,
                                   node: ts.Node & {type?: ts.TypeNode}): ts.ExpressionStatement[] {

  if (!node.type) {
    return [];
  }
  if (node.type.kind === ts.SyntaxKind.NumberKeyword) {
    return [createAssertNumCall(accessor)]
  }
  if (node.type.kind === ts.SyntaxKind.StringKeyword) {
    return [createAssertStringCall(accessor)]
  }
  if (node.type.kind === ts.SyntaxKind.TypeReference) {
    const type = typeChecker.getTypeAtLocation(node)
    if (!type) {
      return []
    }
    const props = typeChecker.getPropertiesOfType(type)
    return props.map(prop => {
      const declaration = prop.declarations[0]
      if (declaration && ts.isPropertySignature(declaration)) {
        return createAssertCallsForType(typeChecker, `${accessor}.${prop.getName()}`, declaration)
      }
      return []
    })
      .flat();
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
            return createAssertCallsForType(typeChecker, parameter.name.getText(), parameter)
          })
          .flat()
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