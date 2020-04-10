import { TypeCheckFailedError } from "./validations";

enum ValidationType {
  Type,
  Value,
  Properties,
  Union,
  Array
}
export interface ValidType {
  valid: true;
}

export interface InvalidType {
  validationType: ValidationType.Type;
  valid: false;
  expected: string;
  actual: string;
}

export interface InvalidValue {
  validationType: ValidationType.Value;
  valid: false;
  expectedValue: unknown;
  actualValue: unknown;
}

export interface InvalidProperty {
  name: string;
  result: InvalidResult;
}

export interface InvalidArrayItem {
  index: number;
  result: InvalidResult;
}

export interface InvalidArrayItems {
  validationType: ValidationType.Array;
  valid: false;
  items: InvalidArrayItem[];
}

export interface InvalidProperties {
  validationType: ValidationType.Properties;
  valid: false;
  properties: InvalidProperty[];
}

export interface InvalidUnion {
  validationType: ValidationType.Union;
  valid: false;
  unionParts: InvalidResult[];
}

export type InvalidResult =
  | InvalidType
  | InvalidProperties
  | InvalidValue
  | InvalidUnion
  | InvalidArrayItems;

export type ValidationResult = ValidType | InvalidResult;

export type Validator = (value: unknown) => ValidationResult;

export type ValidatorProvider = () => Validator | undefined;

export type ValidatorOrProvider = ValidatorProvider | Validator;

export type PropertyValidator = (value: unknown) => InvalidProperty | null;

export type ValueGetter = (obj: any) => unknown;

export type Property = [string, ValueGetter, ValidatorOrProvider];

type ValidatorIndexer = (id: string, validator: Validator) => Validator;

type IndexedProviderGetter = (id: string) => ValidatorProvider;

type ValidatorFactory = (
  index: ValidatorIndexer,
  provider: IndexedProviderGetter
) => Validator;

function isInvalidType(result: InvalidResult): result is InvalidType {
  return result.validationType === ValidationType.Type;
}

function isInvalidValue(result: InvalidResult): result is InvalidValue {
  return result.validationType === ValidationType.Value;
}

function isInvalidProperties(
  result: InvalidResult
): result is InvalidProperties {
  return result.validationType === ValidationType.Properties;
}

function isInvalidUnion(result: InvalidResult): result is InvalidUnion {
  return result.validationType === ValidationType.Union;
}

function isInvalidArray(
  result: InvalidArrayItems
): result is InvalidArrayItems {
  return result.validationType === ValidationType.Array;
}
class IdValidatorIndex {
  private index = new Map<string, Validator>();

  withValidator: ValidatorIndexer = (id, validator) => {
    this.index.set(id, validator);
    return validator;
  };

  providerFor: IndexedProviderGetter = id => {
    return () => {
      const validator = this.index.get(id);
      if (validator === undefined) {
        throw new Error(`Unable to find validator for id ${id}`);
      }
      return validator;
    };
  };
}

export function createValidator(factory: ValidatorFactory) {
  const index = new IdValidatorIndex();
  return factory(index.withValidator, index.providerFor);
}

function isValidatorProvider(
  validatorOrProvider: ValidatorOrProvider
): validatorOrProvider is ValidatorProvider {
  return validatorOrProvider.length === 0;
}

function get(validatorOrProvider: ValidatorOrProvider): Validator {
  if (isValidatorProvider(validatorOrProvider)) {
    const validator = validatorOrProvider();
    if (validator === undefined) {
      throw new Error("Validator was not provided");
    }
    return validator;
  }
  return validatorOrProvider;
}

export function isValidResult(
  validationResult: ValidationResult
): validationResult is ValidType {
  return validationResult.valid;
}

export function isInvalidResult(
  validationResult: ValidationResult
): validationResult is InvalidType {
  return !validationResult.valid;
}

function typeValidator(expectedType: string): Validator {
  return function validateType(value: unknown): ValidationResult {
    const type = typeof value;
    if (type === expectedType) {
      return { valid: true };
    }
    return {
      validationType: ValidationType.Type,
      valid: false,
      actual: type,
      expected: expectedType
    };
  };
}

export const num = typeValidator("number");

export const bool = typeValidator("boolean");

export const str = typeValidator("string");

const objectTypeValidator = (value: unknown): ValidationResult => {
  if (value === null) {
    return {
      validationType: ValidationType.Type,
      valid: false,
      actual: "null",
      expected: "object"
    };
  }
  return typeValidator("object")(value);
};

export function value(expectedValue: unknown): Validator {
  return function validateValue(actualValue: unknown): ValidationResult {
    if (Object.is(expectedValue, actualValue)) {
      return { valid: true };
    }
    return {
      validationType: ValidationType.Value,
      valid: false,
      expectedValue,
      actualValue
    };
  };
}

export function propertyValidator([
  name,
  getValue,
  validator
]: Property): PropertyValidator {
  return function valdateProperty(object: unknown): InvalidProperty | null {
    const result = get(validator)(getValue(object));
    if (isInvalidResult(result)) {
      return {
        name,
        result: result
      };
    }
    return null;
  };
}

function isNotNull<T>(result: T | null): result is T {
  return result !== null;
}

export function props(...properties: Property[]): Validator {
  return function propsValidator(value: unknown): ValidationResult {
    const objectTypeResult = objectTypeValidator(value);
    if (isInvalidResult(objectTypeResult)) {
      return objectTypeResult;
    }
    const results = properties
      .map(property => propertyValidator(property)(value))
      .filter(isNotNull);

    if (results.length === 0) {
      return { valid: true };
    }
    return {
      validationType: ValidationType.Properties,
      valid: false,
      properties: results
    };
  };
}

export function or(...validators: ValidatorOrProvider[]): Validator {
  return function unionValidator(value: unknown): ValidationResult {
    const invalidResults: InvalidResult[] = [];
    for (const validator of validators) {
      const result = get(validator)(value);
      if (isInvalidResult(result)) {
        invalidResults.push(result);
      } else {
        return { valid: true };
      }
    }
    return {
      validationType: ValidationType.Union,
      valid: false,
      unionParts: invalidResults
    };
  };
}

export function array(itemValidator: ValidatorOrProvider): Validator {
  return function arrayValidator(value: unknown): ValidationResult {
    if (Array.isArray(value)) {
      const invalidItems = value
        .map(item => get(itemValidator)(item))
        .map((itemResult, index): InvalidArrayItem | null => {
          if (isInvalidResult(itemResult)) {
            return {
              index,
              result: itemResult
            };
          }
          return null;
        })
        .filter(isNotNull);
      if (invalidItems.length === 0) {
        return { valid: true };
      }
      return {
        validationType: ValidationType.Array,
        valid: false,
        items: invalidItems
      };
    }
    return {
      validationType: ValidationType.Type,
      valid: false,
      expected: "Array",
      actual: value === null ? "null" : typeof value
    };
  };
}

function describeValue(value: unknown) {
  let stringValue = `${value}`;
  if (typeof value === "object" && value !== null) {
    stringValue = `{${Object.entries(value)
      .map(([key, value]) => `${key}:${typeof value}`)
      .join(",")}}`;
  }
  if (stringValue.length > 30) {
    return stringValue.substring(0, 17) + "...";
  }
  return stringValue;
}

function joinPath(path: string[]): string {
  return path.join(".").replace(/\.\[/g, "[");
}

function describeInvalidResult(
  result: InvalidResult,
  path: string[]
): string[] {
  if (isInvalidType(result)) {
    return [
      `${joinPath(path)}: expected type "${result.expected}" but was ${
        result.actual
      }`
    ];
  }
  if (isInvalidValue(result)) {
    return [
      `${joinPath(path)}: expected value "${
        result.expectedValue
      }" but was ${describeValue(result.actualValue)}`
    ];
  }
  if (isInvalidProperties(result)) {
    return result.properties
      .map(prop => describeInvalidResult(prop.result, path.concat(prop.name)))
      .flat();
  }
  if (isInvalidUnion(result)) {
    return result.unionParts
      .map(part => describeInvalidResult(part, path))
      .flat();
  }
  if (isInvalidArray(result)) {
    return result.items
      .map(item =>
        describeInvalidResult(
          item.result,
          path
            .slice(0, path.length - 1)
            .concat(`${path[path.length - 1]}[${item.index}]`)
        )
      )
      .flat();
  }
  throw new Error("Unsupported validation type");
}

export function resultAsString(result: ValidationResult, name: string): string {
  if (isInvalidResult(result)) {
    return describeInvalidResult(result, [name]).join("\n");
  }
  return "OK";
}

export function assertValidType(
  name: string,
  value: unknown,
  factory: ValidatorFactory
): void {
  const validator = createValidator(factory);
  const result = validator(value);
  if (isInvalidResult(result)) {
    throw new TypeCheckFailedError(resultAsString(result, name));
  }
}
