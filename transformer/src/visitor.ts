import * as ts from "typescript";

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

type IdType = ts.Type & { id: number };

function isIdType(type: ts.Type): type is IdType {
  return Boolean((type as IdType).id);
}

function createNumValueCall(
  rvLib: ts.Identifier,
  value: number
): ts.Expression {
  return ts.createCall(ts.createPropertyAccess(rvLib, "value"), undefined, [
    ts.createNumericLiteral(`${value}`),
  ]);
}

function createStringValueCall(
  rvLib: ts.Identifier,
  value: string
): ts.Expression {
  return ts.createCall(ts.createPropertyAccess(rvLib, "value"), undefined, [
    ts.createStringLiteral(`${value}`),
  ]);
}

function createBooleanValueCall(
  rvLib: ts.Identifier,
  value: boolean
): ts.Expression {
  return ts.createCall(ts.createPropertyAccess(rvLib, "value"), undefined, [
    value ? ts.createTrue() : ts.createFalse(),
  ]);
}

function createArrayCall(
  rvLib: ts.Identifier,
  delegate: ts.Expression
): ts.Expression {
  return ts.createCall(ts.createPropertyAccess(rvLib, "array"), undefined, [
    delegate,
  ]);
}

function createUnionCall(
  rvLib: ts.Identifier,
  delegates: ts.Expression[]
): ts.Expression {
  return ts.createCall(
    ts.createPropertyAccess(rvLib, "or"),
    undefined,
    delegates
  );
}

function createPropsCall(
  rvLib: ts.Identifier,
  props: ts.Expression[]
): ts.Expression {
  return ts.createCall(
    ts.createPropertyAccess(rvLib, "props"),
    undefined,
    props
  );
}

function createProviderCall(id: number): ts.Expression {
  return ts.createCall(ts.createIdentifier("provider"), undefined, [
    ts.createStringLiteral(`${id}`),
  ]);
}

function createIndexCall(id: number, validator: ts.Expression): ts.Expression {
  return ts.createCall(ts.createIdentifier("index"), undefined, [
    ts.createStringLiteral(`${id}`),
    validator,
  ]);
}

function createValueGetter(propName: string): ts.Expression {
  let propAccess;
  if (/^[a-zA-Z_$][a-zA-Z_$]*$/.test(propName)) {
    propAccess = ts.createPropertyAccess(ts.createIdentifier("v"), propName);
  } else {
    propAccess = ts.createElementAccess(
      ts.createIdentifier("v"),
      ts.createStringLiteral(propName)
    );
  }
  return ts.createArrowFunction(
    [],
    [],
    [ts.createParameter(undefined, undefined, undefined, "v")],
    undefined,
    undefined,
    propAccess
  );
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

function createValidatorExpression(
  typeChecker: ts.TypeChecker,
  rvLib: ts.Identifier,
  types: Set<number>,
  type?: ts.Type
): ts.Expression | null {
  if (!type) {
    return null;
  }
  const references = new Map<string, ts.Type>();
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
    return ts.createPropertyAccess(rvLib, "num");
  }
  if (type.getFlags() & ts.TypeFlags.String) {
    return ts.createPropertyAccess(rvLib, "str");
  }
  if (type.getFlags() & ts.TypeFlags.Boolean) {
    return ts.createPropertyAccess(rvLib, "bool");
  }
  if (type.getFlags() & ts.TypeFlags.Null) {
    return ts.createPropertyAccess(rvLib, "nullValue");
  }
  if (type.getFlags() & ts.TypeFlags.Undefined) {
    return ts.createPropertyAccess(rvLib, "undefinedValue");
  }
  if (isNumberLiteral(type)) {
    return createNumValueCall(rvLib, type.value);
  }
  if (isStringLiteral(type)) {
    return createStringValueCall(rvLib, type.value);
  }
  if (isBooleanLitral(type)) {
    return createBooleanValueCall(rvLib, type.intrinsicName === "true");
  }
  if (isArrayType(type)) {
    const itemCheck =
      isTypeReference(type) &&
      type.typeArguments &&
      type.typeArguments.length === 1 &&
      createValidatorExpression(
        typeChecker,
        rvLib,
        types,
        type.typeArguments[0]
      );
    if (itemCheck) {
      return createArrayCall(rvLib, itemCheck);
    } else {
      return createArrayCall(rvLib, ts.createPropertyAccess(rvLib, "any"));
    }
  }
  if (type.isUnion()) {
    const typesWithOptionalsFirst = type.types.slice();
    typesWithOptionalsFirst.sort((t1, t2) => {
      if (isOptional(t1) && !isOptional(t2)) {
        return -1;
      }
      if (!isOptional(t1) && isOptional(t2)) {
        return 1;
      }
      return 0;
    });
    const validators = typesWithOptionalsFirst.map((type) =>
      createValidatorExpression(typeChecker, rvLib, types, type)
    );
    return createUnionCall(rvLib, validators.filter(isNotNull));
  }
  if (type.isClassOrInterface() || type.getFlags() & ts.TypeFlags.Object) {
    const props = typeChecker.getPropertiesOfType(type);
    const createPropDefinitions = () => {
      return props
        .map((prop) => {
          const declaration = prop.declarations[0];
          if (declaration && ts.isPropertySignature(declaration)) {
            let propType = typeChecker.getTypeAtLocation(declaration);
            if (propType.isTypeParameter()) {
              const symbol = propType.getSymbol();
              if (symbol && references.has(symbol.getName())) {
                propType = references.get(symbol.getName())!;
              }
            }
            const validator = createValidatorExpression(
              typeChecker,
              rvLib,
              types,
              propType
            );
            if (validator === null) {
              return null;
            }
            return ts.createArrayLiteral([
              ts.createStringLiteral(prop.getName()),
              createValueGetter(prop.getName()),
              validator,
            ]);
          }
          return null;
        })
        .filter(isNotNull);
    };
    if (isIdType(type)) {
      if (types.has(type.id)) {
        return createProviderCall(type.id);
      }
      types.add(type.id);
      return createIndexCall(
        type.id,
        createPropsCall(rvLib, createPropDefinitions())
      );
    }
    return createPropsCall(rvLib, createPropDefinitions());
  }
  return null;
}

function createAssertValidTypeCall(
  rvLib: ts.Identifier,
  validator: ts.Expression,
  value: ts.Expression
): ts.Expression {
  return ts.createCall(
    ts.createPropertyAccess(rvLib, "assertValidType"),
    undefined,
    [
      ts.createStringLiteral(value.getText()),
      value,
      ts.createArrowFunction(
        undefined,
        undefined,
        [
          ts.createParameter(undefined, undefined, undefined, "index"),
          ts.createParameter(undefined, undefined, undefined, "provider"),
        ],
        undefined,
        undefined,
        validator
      ),
    ]
  );
}

function createIsTypeCall(
  rvLib: ts.Identifier,
  validator: ts.Expression,
  value: ts.Expression
) {
  return ts.createCall(ts.createPropertyAccess(rvLib, "isType"), undefined, [
    value,
    ts.createArrowFunction(
      undefined,
      undefined,
      [
        ts.createParameter(undefined, undefined, undefined, "index"),
        ts.createParameter(undefined, undefined, undefined, "provider"),
      ],
      undefined,
      undefined,
      validator
    ),
  ]);
}

function bindingMatcher(
  name: string
): (binding: ts.ImportSpecifier) => boolean {
  return (binding) =>
    binding.propertyName
      ? binding.propertyName.getText() === name
      : binding.name.getText() === name;
}

export function createVisitor(typeChecker: ts.TypeChecker) {
  function visitor(ctx: ts.TransformationContext) {
    const rvlib = ts.createFileLevelUniqueName("rvlib");
    let runtimeAssertFunctionName: string | null = null;
    let runtimeIsFunctionName: string | null = null;
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      // here we can check each node and potentially return
      // new nodes if we want to leave the node as is, and
      // continue searching through child nodes:
      if (
        ts.isCallExpression(node) &&
        runtimeAssertFunctionName &&
        node.expression.getText() === runtimeAssertFunctionName
      ) {
        let type: ts.Type;
        if (!node.typeArguments || node.typeArguments.length !== 1) {
          type = typeChecker.getTypeAtLocation(node.arguments[0]);
        } else {
          type = typeChecker.getTypeAtLocation(node.typeArguments[0]);
        }
        const validator = createValidatorExpression(
          typeChecker,
          rvlib,
          new Set(),
          type
        );
        if (validator === null) {
          return node.expression;
        }
        return createAssertValidTypeCall(rvlib, validator, node.arguments[0]);
      } else if (
        ts.isCallExpression(node) &&
        runtimeIsFunctionName &&
        node.expression.getText() === runtimeIsFunctionName
      ) {
        if (!node.typeArguments || node.typeArguments.length !== 1) {
          throw new Error("type argument required");
        }
        const validator = createValidatorExpression(
          typeChecker,
          rvlib,
          new Set(),
          typeChecker.getTypeAtLocation(node.typeArguments[0])
        );
        if (validator === null) {
          return node.expression;
        }
        return createIsTypeCall(rvlib, validator, node.arguments[0]);
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
          const runtimeAssertTypeBinding = node.importClause.namedBindings.elements.find(
            bindingMatcher("runtimeAssertType")
          );
          const runtimeIsTypeBinding = node.importClause.namedBindings.elements.find(
            bindingMatcher("runtimeIsType")
          );
          if (runtimeAssertTypeBinding) {
            runtimeAssertFunctionName = runtimeAssertTypeBinding.name.getText();
          }
          if (runtimeIsTypeBinding) {
            runtimeIsFunctionName = runtimeIsTypeBinding.name.getText();
          }
          if (runtimeAssertTypeBinding || runtimeIsTypeBinding) {
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
    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor(ctx));
  };
}
