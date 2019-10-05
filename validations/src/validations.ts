export interface RuntimeTypeError {
  path: string[];
  expected: string;
  actual: string;
}
export interface CheckOutcome {
  isOk(): boolean;
  getErrors(): RuntimeTypeError[];
}

export class OkOutcome implements CheckOutcome {
  getErrors(): RuntimeTypeError[] {
    return [];
  }

  isOk(): boolean {
    return true;
  }
}

export class FailOutcome implements CheckOutcome {
  constructor(
    private accessor: string,
    private expected: string,
    private actual: string
  ) {}

  getErrors(): RuntimeTypeError[] {
    return [
      { path: [this.accessor], expected: this.expected, actual: this.actual }
    ];
  }

  isOk(): boolean {
    return false;
  }
}

class ArrayItemOutcome implements CheckOutcome {
  constructor(private index: number, private wrappedOutcome: CheckOutcome) {}

  getErrors(): RuntimeTypeError[] {
    return this.wrappedOutcome.getErrors().map(error => ({
      ...error,
      path: [`[${this.index}]`, ...error.path.slice(1)]
    }));
  }

  isOk(): boolean {
    return this.wrappedOutcome.isOk();
  }
}

class InterfaceOutcome implements CheckOutcome {
  constructor(
    private accessor: string,
    private childOutcomes: CheckOutcome[]
  ) {}
  getErrors(): RuntimeTypeError[] {
    return this.childOutcomes
      .map(notOkChild =>
        notOkChild.getErrors().map(childError => ({
          ...childError,
          path: [this.accessor, ...childError.path]
        }))
      )
      .flat();
  }

  isOk(): boolean {
    return this.childOutcomes.every(child => child.isOk());
  }
}

class UnionOutcome implements CheckOutcome {
  constructor(
    private accessor: string,
    private childOutcomes: CheckOutcome[]
  ) {}
  getErrors(): RuntimeTypeError[] {
    return this.childOutcomes.map(outcome => outcome.getErrors()).flat();
  }

  isOk(): boolean {
    return this.childOutcomes.some(child => child.isOk());
  }
}

function failedCheckToString(result: RuntimeTypeError) {
  const accessor = result.path.join(".").replace(/\.\[/g, "[");
  return `Expected '${accessor}' to be '${result.expected}', but is was '${result.actual}'`;
}

function typeName(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype && prototype.name) {
      return prototype.name;
    }
    return "object";
  }
  return typeof value;
}

export function checkNumber(num: any, accessor: string): CheckOutcome {
  if (typeof num !== "number") {
    return new FailOutcome(accessor, "number", typeName(num));
  }
  return new OkOutcome();
}

export function checkString(str: any, accessor: string): CheckOutcome {
  if (typeof str !== "string") {
    return new FailOutcome(accessor, "string", typeName(str));
  }
  return new OkOutcome();
}

export function checkBoolean(bool: any, accessor: string): CheckOutcome {
  if (typeof bool !== "boolean") {
    return new FailOutcome(accessor, "boolean", typeName(bool));
  }
  return new OkOutcome();
}

export function checkNumberLiteral(
  num: any,
  accessor: string,
  expectedNumber: number
): CheckOutcome {
  const numberCheck = checkNumber(num, accessor);
  if (!numberCheck.isOk()) {
    return numberCheck;
  }
  if (num !== expectedNumber) {
    return new FailOutcome(accessor, `${expectedNumber}`, `${num}`);
  }
  return new OkOutcome();
}

export function checkStringLiteral(
  str: any,
  accessor: string,
  expectedString: string
): CheckOutcome {
  const stringCheck = checkString(str, accessor);
  if (!stringCheck.isOk()) {
    return stringCheck;
  }
  if (str !== expectedString) {
    return new FailOutcome(accessor, `${expectedString}`, `'${str}'`);
  }
  return new OkOutcome();
}

export function checkBooleanLiteral(
  bool: any,
  accessor: string,
  expectedBoolean: string
): CheckOutcome {
  const stringCheck = checkBoolean(bool, accessor);
  if (!stringCheck.isOk()) {
    return stringCheck;
  }
  if (bool !== expectedBoolean) {
    return new FailOutcome(accessor, `${expectedBoolean}`, `'${bool}'`);
  }
  return new OkOutcome();
}

export function checkArray(
  array: any,
  accessor: string,
  checkItem?: (item: any, index: number) => CheckOutcome
): CheckOutcome {
  if (Array.isArray(array)) {
    const itemResults = checkItem
      ? array
          .map(checkItem)
          .map((outcome, index) => new ArrayItemOutcome(index, outcome))
      : [];
    return new InterfaceOutcome(accessor, itemResults);
  }
  return new FailOutcome(accessor, "Array", typeof array);
}

export function checkInterface(
  checkResults: CheckOutcome[],
  accessor: string
): CheckOutcome {
  return new InterfaceOutcome(accessor, checkResults);
}

export function checkUnion(
  checkResults: CheckOutcome[],
  accessor: string
): CheckOutcome {
  return new UnionOutcome(accessor, checkResults);
}

export function checkOptional(
  optional: any,
  onDefined: () => CheckOutcome
): CheckOutcome {
  if (optional !== undefined && optional !== null) {
    return onDefined();
  }
  return new OkOutcome();
}

function createErrorMessageFromFailedChecks(failedChecks: RuntimeTypeError[]) {
  const failedChecksString = failedChecks.map(failedCheckToString).join(", ");
  return `Runtime type check failed: ${failedChecksString}`;
}

export class TypeCheckFailedError extends Error {}

export function assertType<T>(value: T, checkResults: CheckOutcome[]): T {
  const failedOutcomes = checkResults.filter(outome => !outome.isOk());
  if (failedOutcomes.length > 0) {
    throw new TypeCheckFailedError(
      createErrorMessageFromFailedChecks(
        failedOutcomes.map(outcome => outcome.getErrors()).flat()
      )
    );
  }
  return value;
}
