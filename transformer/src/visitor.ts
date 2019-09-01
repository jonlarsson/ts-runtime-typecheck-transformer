import * as ts from 'typescript'

function createCheckNumCall(identifier: string, rvLib: ts.Identifier) {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkNumber"), undefined, [
      ts.createIdentifier(identifier),
      ts.createStringLiteral(identifier)
    ])
  );
}

function createCheckStringCall(
  identifier: string,
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkString"), undefined, [
      ts.createIdentifier(identifier),
      ts.createStringLiteral(identifier)
    ])
  );
}

function createCheckBooleanCall(
  identifier: string,
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkBoolean"), undefined, [
      ts.createIdentifier(identifier),
      ts.createStringLiteral(identifier)
    ])
  );
}

function createCheckInterfaceCall(
  checks: ts.ExpressionStatement[],
  identifier: string,
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkInterface"), undefined, [
      ts.createArrayLiteral(
        checks.map(statement => statement.expression),
        true
      ),
      ts.createStringLiteral(identifier)
    ])
  );
}

function createCheckUnionCall(
  checks: ts.ExpressionStatement[],
  identifier: string,
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkUnion"), undefined, [
      ts.createArrayLiteral(
        checks.map(statement => statement.expression),
        true
      ),
      ts.createStringLiteral(identifier)
    ])
  );
}

function createCheckOptionalCall(
  checks: ts.ExpressionStatement[],
  identifier: string,
  rvLib: ts.Identifier
) {
  const onDefinedLamda = ts.createArrowFunction(
    [],
    [],
    [],
    undefined,
    undefined,
    ts.createArrayLiteral(checks.map(check => check.expression), true)
  );
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkOptional"), undefined, [
      ts.createIdentifier(identifier),
      onDefinedLamda
    ])
  );
}

function createAssertTypeCall(
  expression: ts.Expression,
  checks: ts.ExpressionStatement[],
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "assertType"), undefined, [
      expression,
      ts.createArrayLiteral(checks.map(statement => statement.expression), true)
    ])
  );
}

function isExpressionStatement(
  candidate: ts.ExpressionStatement | null
): candidate is ts.ExpressionStatement {
  return !!candidate;
}

function hasValidateComment(sf: ts.SourceFile, node: ts.Node): boolean {
  const commentRanges = ts.getLeadingCommentRanges(
    sf.getText(),
    node.getFullStart()
  );
  return (
    commentRanges !== undefined &&
    commentRanges.some(commentRange => {
      const commentText = sf
        .getText()
        .substring(commentRange.pos, commentRange.end);
      return /@validate/.test(commentText);
    })
  );
}

function isOptional(type: ts.Type) {
  return (
    type.getFlags() & ts.TypeFlags.Undefined ||
    type.getFlags() & ts.TypeFlags.Null
  );
}

function createCheckCallsForType(
  typeChecker: ts.TypeChecker,
  rvLib: ts.Identifier,
  accessor: string,
  type?: ts.Type
): ts.ExpressionStatement | null {
  if (!type) {
    return null;
  }
  if (type.getFlags() & ts.TypeFlags.Number) {
    return createCheckNumCall(accessor, rvLib);
  }
  if (type.getFlags() & ts.TypeFlags.String) {
    return createCheckStringCall(accessor, rvLib);
  }
  if (type.getFlags() & ts.TypeFlags.Boolean) {
    return createCheckBooleanCall(accessor, rvLib);
  }
  if (type.isUnion()) {
    const typesExceptOptional = type.types.filter(type => !isOptional(type));
    if (type.types.length > typesExceptOptional.length) {
      if (typesExceptOptional.length === 1) {
        const checkCall = createCheckCallsForType(
          typeChecker,
          rvLib,
          accessor,
          typesExceptOptional[0]
        );
        return isExpressionStatement(checkCall)
          ? createCheckOptionalCall([checkCall], accessor, rvLib)
          : null;
      }
      const checkUnionCalls = createCheckUnionCall(
        typesExceptOptional
          .map(type =>
            createCheckCallsForType(typeChecker, rvLib, accessor, type)
          )
          .filter(isExpressionStatement),
        accessor,
        rvLib
      );
      return createCheckOptionalCall([checkUnionCalls], accessor, rvLib);
    }
    return createCheckUnionCall(
      type.types
        .map(type =>
          createCheckCallsForType(typeChecker, rvLib, accessor, type)
        )
        .filter(isExpressionStatement),
      accessor,
      rvLib
    );
  }
  if (type.isClassOrInterface()) {
    const props = typeChecker.getPropertiesOfType(type);
    const interfaceChecks = props
      .map(prop => {
        const declaration = prop.declarations[0];
        if (declaration && ts.isPropertySignature(declaration)) {
          return createCheckCallsForType(
            typeChecker,
            rvLib,
            `${accessor}.${prop.getName()}`,
            typeChecker.getTypeAtLocation(declaration)
          );
        }
        return null;
      })
      .filter(isExpressionStatement);

    return createCheckInterfaceCall(interfaceChecks, accessor, rvLib);
  }
  return null;
}

export function createVisitor(typeChecker: ts.TypeChecker) {
  function visitor(ctx: ts.TransformationContext, sf: ts.SourceFile) {
    let libNeeded = false;
    const rvlib = ts.createFileLevelUniqueName("rvlib");
    let placeholderFunctionName: string | null = null;
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      if (
        ts.isCallExpression(node) &&
        placeholderFunctionName &&
        node.expression.getText() === placeholderFunctionName
      ) {
        const assertCalls = node.arguments
          .map(argument => {
            libNeeded = true;
            return createCheckCallsForType(
              typeChecker,
              rvlib,
              argument.getText(),
              typeChecker.getTypeAtLocation(argument)
            );
          })
          .filter(isExpressionStatement);
        return createAssertTypeCall(ts.createNull(), assertCalls, rvlib)
          .expression;
      } else if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        /["'`]ts-runtime-typecheck-validations["'`]/.test(node.moduleSpecifier.getText())
      ) {
        if (
          node.importClause &&
          node.importClause.namedBindings &&
          ts.isNamedImports(node.importClause.namedBindings)
        ) {
          const runtimeTypecheckBinding = node.importClause.namedBindings.elements.find(
            binding =>
              binding.propertyName
                ? binding.propertyName.getText() === "runtimeTypecheck"
                : binding.name.getText() === "runtimeTypecheck"
          );
          if (runtimeTypecheckBinding) {
            placeholderFunctionName = runtimeTypecheckBinding.name.getText();
          }
        }
        const importClause = ts.createImportClause(
          undefined,
          ts.createNamespaceImport(rvlib)
        );
        return ts.createImportDeclaration(
          [],
          [],
          importClause,
          ts.createStringLiteral("ts-runtime-typecheck-validations")
        );
      } else {
        return ts.visitEachChild(node, visitor, ctx);
      }
    };
    return visitor;
  }

  return (ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx, sf));
  };
}
