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

function createCheckInterfaceCall(checks: ts.ExpressionStatement[], identifier: string): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkInterface'),
    undefined,
    [ts.createArrayLiteral(checks.map(statement => statement.expression), true), ts.createStringLiteral(identifier)],
  ))
}

function createCheckUnionCall (checks: ts.ExpressionStatement[], identifier: string): ts.ExpressionStatement {
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkUnion'),
    undefined,
    [ts.createArrayLiteral(checks.map(statement => statement.expression), true), ts.createStringLiteral(identifier)],
  ))
}

function createCheckOptionalCall(checks: ts.ExpressionStatement[], identifier: string) {
  const onDefinedLamda = ts.createArrowFunction([], [], [], undefined, undefined,
    ts.createArrayLiteral(checks.map(check => check.expression), true));
  return ts.createExpressionStatement(ts.createCall(
    ts.createIdentifier('checkOptional'),
    undefined,
    [ts.createIdentifier(identifier), onDefinedLamda],
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

function isOptional(type: ts.Type) {
  return (type.getFlags() & ts.TypeFlags.Undefined) || (type.getFlags() & ts.TypeFlags.Null);
}

function createCheckCallsForType (typeChecker: ts.TypeChecker,
                                    accessor: string,
                                    type?: ts.Type): ts.ExpressionStatement | null {
  if (!type) {
    return null
  }
  if (type.getFlags() & ts.TypeFlags.Number) {
    return createCheckNumCall(accessor)
  }
  if (type.getFlags() & ts.TypeFlags.String) {
    return createCheckStringCall(accessor)
  }
  if (type.isUnion()) {
    const typesExceptOptional = type.types.filter(type => !isOptional(type));
    if (type.types.length > typesExceptOptional.length) {
      if (typesExceptOptional.length === 1) {
        const checkCall = createCheckCallsForType(typeChecker, accessor, typesExceptOptional[0])
        return isExpressionStatement(checkCall) ? createCheckOptionalCall([checkCall], accessor) : null;
      }
      const checkUnionCalls = createCheckUnionCall(typesExceptOptional
        .map(type => createCheckCallsForType(typeChecker, accessor, type))
        .filter(isExpressionStatement), accessor)
      return createCheckOptionalCall([checkUnionCalls], accessor);
    }
    return createCheckUnionCall(type.types
      .map(type => createCheckCallsForType(typeChecker, accessor, type))
      .filter(isExpressionStatement), accessor);
  }
  if (type.isClassOrInterface()) {
    const props = typeChecker.getPropertiesOfType(type)
    const interfaceChecks = props.map(prop => {
      const declaration = prop.declarations[0]
      if (declaration && ts.isPropertySignature(declaration)) {
        return createCheckCallsForType(typeChecker,
          `${accessor}.${prop.getName()}`,
          typeChecker.getTypeAtLocation(declaration))
      }
      return []
    })
      .flat()

    return createCheckInterfaceCall(interfaceChecks, accessor);
  }
  return null;
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
            return createCheckCallsForType(typeChecker, parameter.name.getText(), typeChecker.getTypeAtLocation(parameter))
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