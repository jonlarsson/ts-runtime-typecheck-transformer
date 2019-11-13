import * as ts from "typescript";

function accessorFromPath(path: string[]) {
  return ts.createIdentifier(path.join("."));
}

function identifierFromPath(path: string[]) {
  return ts.createStringLiteral(path[path.length - 1]);
}

function createCheckNumCall(path: string[], rvLib: ts.Identifier) {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkNumber"), undefined, [
      accessorFromPath(path),
      identifierFromPath(path)
    ])
  );
}

function createCheckStringCall(
  path: string[],
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkString"), undefined, [
      accessorFromPath(path),
      identifierFromPath(path)
    ])
  );
}

function createCheckBooleanCall(
  path: string[],
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkBoolean"), undefined, [
      accessorFromPath(path),
      identifierFromPath(path)
    ])
  );
}

function createCheckNumberLiteralCall(
  path: string[],
  expected: number,
  rvLib: ts.Identifier
) {
  return ts.createExpressionStatement(
    ts.createCall(
      ts.createPropertyAccess(rvLib, "checkNumberLiteral"),
      undefined,
      [
        accessorFromPath(path),
        identifierFromPath(path),
        ts.createNumericLiteral(`${expected}`)
      ]
    )
  );
}

function createCheckBooleanLiteralCall(
  path: string[],
  expected: boolean,
  rvLib: ts.Identifier
) {
  return ts.createExpressionStatement(
    ts.createCall(
      ts.createPropertyAccess(rvLib, "checkBooleanLiteral"),
      undefined,
      [
        accessorFromPath(path),
        identifierFromPath(path),
        expected ? ts.createTrue() : ts.createFalse()
      ]
    )
  );
}

function createCheckStringLiteralCall(
  path: string[],
  expected: string,
  rvLib: ts.Identifier
) {
  return ts.createExpressionStatement(
    ts.createCall(
      ts.createPropertyAccess(rvLib, "checkStringLiteral"),
      undefined,
      [
        accessorFromPath(path),
        identifierFromPath(path),
        ts.createStringLiteral(expected)
      ]
    )
  );
}

function createCheckInterfaceCall(
  checks: ts.ExpressionStatement[],
  path: string[],
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkInterface"), undefined, [
      ts.createArrayLiteral(
        checks.map(statement => statement.expression),
        true
      ),
      identifierFromPath(path)
    ])
  );
}

function createCheckArrayCall(
  path: string[],
  rvLib: ts.Identifier,
  itemCheck?: ts.ArrowFunction
): ts.ExpressionStatement {
  const requiredArgs = [accessorFromPath(path), identifierFromPath(path)];
  const args = itemCheck ? [...requiredArgs, itemCheck] : requiredArgs;
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkArray"), undefined, args)
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
  path: string[],
  rvLib: ts.Identifier
): ts.ExpressionStatement {
  return ts.createExpressionStatement(
    ts.createCall(ts.createPropertyAccess(rvLib, "checkUnion"), undefined, [
      ts.createArrayLiteral(
        checks.map(statement => statement.expression),
        true
      ),
      identifierFromPath(path)
    ])
  );
}

function createCheckOptionalCall(
  check: ts.ExpressionStatement,
  path: string[],
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
      accessorFromPath(path),
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

function isObjectType(type: ts.Type): type is ts.ObjectType {
  return Boolean(type.getFlags() && ts.TypeFlags.Object);
}

function isTupleType(type: ts.ObjectType): type is ts.TupleType {
  return Boolean(type.objectFlags & ts.ObjectFlags.Tuple);
}

function isArrayType(type: ts.Type): type is ts.ObjectType {
  const symbol = type.getSymbol();
  return (
    isObjectType(type) &&
    (isTupleType(type) || Boolean(symbol && symbol.getName() === "Array"))
  );
}

interface BooleanLiteral extends ts.Type {
  intrinsicName: string;
}
function isBooleanLitral(type: ts.Type): type is BooleanLiteral {
  return Boolean(type.getFlags() & ts.TypeFlags.BooleanLiteral);
}

function isNumberLiteral(type: ts.Type): type is ts.NumberLiteralType {
  return Boolean(type.getFlags() & ts.TypeFlags.NumberLiteral);
}

function isStringLiteral(type: ts.Type): type is ts.StringLiteralType {
  return Boolean(type.getFlags() & ts.TypeFlags.StringLiteral);
}

function createCheckCallsForType(
  typeChecker: ts.TypeChecker,
  rvLib: ts.Identifier,
  accessor: string[],
  type?: ts.Type
): ts.ExpressionStatement | null {
  const references = new Map<string, ts.Type>();
  if (!type) {
    return null;
  }
  if (isTypeReference(type) && type.target.typeParameters) {
    type.target.typeParameters.forEach((typeParameter, index) => {
      const typeArguments = type.typeArguments;
      const symbol = typeParameter.getSymbol();
      if (!symbol || !typeArguments) {
        return;
      }
      const typeArgument = typeArguments[index];
      const name = symbol.getName();
      references.set(name, typeArgument);
    });
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
  if (isNumberLiteral(type)) {
    return createCheckNumberLiteralCall(accessor, type.value, rvLib);
  }
  if (isStringLiteral(type)) {
    return createCheckStringLiteralCall(accessor, type.value, rvLib);
  }
  if (isBooleanLitral(type)) {
    return createCheckBooleanLiteralCall(
      accessor,
      type.intrinsicName === "true",
      rvLib
    );
  }
  if (isArrayType(type)) {
    const itemCheck =
      isTypeReference(type) &&
      type.typeArguments &&
      type.typeArguments.length === 1 &&
      createCheckCallsForType(
        typeChecker,
        rvLib,
        ["item"],
        type.typeArguments[0]
      );
    if (itemCheck) {
      const checkArrowFunction = createItemCheckArrowFunction(itemCheck);
      return createCheckArrayCall(accessor, rvLib, checkArrowFunction);
    } else {
      return createCheckArrayCall(accessor, rvLib);
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
          let propType = typeChecker.getTypeAtLocation(declaration);
          if (propType.isTypeParameter()) {
            const symbol = propType.getSymbol();
            if (symbol && references.has(symbol.getName())) {
              propType = references.get(symbol.getName())!;
            }
          }
          return createCheckCallsForType(
            typeChecker,
            rvLib,
            accessor.concat(prop.getName()),
            propType
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
              [argument.getText()],
              typeChecker.getTypeAtLocation(argument)
            );
          })
          .filter(isExpressionStatement);
        return createAssertTypeCall(ts.createNull(), assertCalls, rvlib)
          .expression;
      } else if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        /["'`]@ts-rtc\/validations["'`]/.test(node.moduleSpecifier.getText())
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
            const importClause = ts.createImportClause(
              undefined,
              ts.createNamespaceImport(rvlib)
            );
            return ts.createImportDeclaration(
              [],
              [],
              importClause,
              ts.createStringLiteral("@ts-rtc/validations")
            );
          }
          return node;
        }
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
