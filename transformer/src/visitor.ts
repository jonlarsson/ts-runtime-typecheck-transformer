import * as ts from "typescript";

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

function createCheckArrayCall(
  itemCheck: ts.ArrowFunction,
  identifier: string,
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkArray"), undefined, [
      ts.createIdentifier(identifier),
      ts.createStringLiteral(identifier),
      itemCheck
    ])
  );
}

function createItemCheckArrowFunction(expression: ts.ExpressionStatement) {
  return ts.createArrowFunction(
    undefined,
    undefined,
    [
      ts.createParameter(undefined, undefined, undefined, "item"),
      ts.createParameter(undefined, undefined, undefined, "index")
    ],
    undefined,
    undefined,
    expression.expression
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
  check: ts.ExpressionStatement,
  identifier: string,
  rvLib: ts.Identifier
) {
  const onDefinedLamda = ts.createArrowFunction(
    [],
    [],
    [],
    undefined,
    undefined,
    check.expression
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

function isOptional(type: ts.Type) {
  return (
    type.getFlags() & ts.TypeFlags.Undefined ||
    type.getFlags() & ts.TypeFlags.Null
  );
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return Array.isArray((type as ts.TypeReference).typeArguments);
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
  const symbol = type.getSymbol();
  if (type.getFlags() & ts.TypeFlags.Number) {
    return createCheckNumCall(accessor, rvLib);
  }
  if (type.getFlags() & ts.TypeFlags.String) {
    return createCheckStringCall(accessor, rvLib);
  }
  if (type.getFlags() & ts.TypeFlags.Boolean) {
    return createCheckBooleanCall(accessor, rvLib);
  }
  if (
    type.getFlags() & ts.TypeFlags.Object &&
    symbol &&
    symbol.getName() === "Array" &&
    isTypeReference(type) &&
    type.typeArguments &&
    type.typeArguments.length === 1
  ) {
    const itemCheck = createCheckCallsForType(
      typeChecker,
      rvLib,
      "item",
      type.typeArguments[0]
    );
    if (itemCheck) {
      const checkArrowFunction = createItemCheckArrowFunction(itemCheck);
      return createCheckArrayCall(checkArrowFunction, accessor, rvLib);
    } else {
      return null;
    }
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
          ? createCheckOptionalCall(checkCall, accessor, rvLib)
          : null;
      }
      const checkUnionCall = createCheckUnionCall(
        typesExceptOptional
          .map(type =>
            createCheckCallsForType(typeChecker, rvLib, accessor, type)
          )
          .filter(isExpressionStatement),
        accessor,
        rvLib
      );
      return createCheckOptionalCall(checkUnionCall, accessor, rvLib);
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
  if (type.isClassOrInterface() || type.getFlags() & ts.TypeFlags.Object) {
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
        /["'`]ts-runtime-typecheck-validations["'`]/.test(
          node.moduleSpecifier.getText()
        )
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
