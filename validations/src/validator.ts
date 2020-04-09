enum ValidationType {
  Type,
  Value,
  Properties,
  Union
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
  | InvalidUnion;

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

export const bool = typeValidator("bool");

export const str = typeValidator("string");

const objectTypeValidator = typeValidator("object");

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

function isInvalidProperty(
  result: InvalidProperty | null
): result is InvalidProperty {
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
      .filter(isInvalidProperty);

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

function describeInvalidResult(
  result: InvalidResult,
  path: string[]
): string[] {
  if (isInvalidType(result)) {
    return [
      `${path.join(".")}: expected type "${result.expected}" but was ${
        result.actual
      }`
    ];
  }
  if (isInvalidValue(result)) {
    return [
      `${path.join(".")}: expected value "${
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
  throw new Error("Unsupported validation type");
}

export function resultAsString(result: ValidationResult, name: string): string {
  if (isInvalidResult(result)) {
    return describeInvalidResult(result, [name]).join("\n");
  }
  return "OK";
}
