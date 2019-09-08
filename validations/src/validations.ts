export interface PassedCheckResult {
  ok: true;
}

const OK: PassedCheckResult = {
  ok: true
};

export interface FailedCheckResult {
  ok: false;
  accessor: string;
  error: string;
}``

export type CheckResult = PassedCheckResult | FailedCheckResult;

function failedCheckToString(result: FailedCheckResult) {
  return `${result.accessor}: ${result.error}`;
}

export function failedCheck(accessor: string, error: string) {
  return {
    ok: false,
    error,
    accessor
  };
}

function isFailedCheckResult(result: CheckResult): result is FailedCheckResult {
  return !result.ok;
}

export function checkNumber(num: any, accessor: string): CheckResult {
  if (typeof num !== "number") {
    return failedCheck(accessor, `Not a number, got '${typeof num}'`);
  }
  return OK;
}

export function checkString(str: any, accessor: string): CheckResult {
  if (typeof str !== "string") {
    return failedCheck(accessor, `Not a string, got '${typeof str}'`);
  }
  return OK;
}

export function checkBoolean(bool: any, accessor: string): CheckResult {
  if (typeof bool !== "boolean") {
    return failedCheck(accessor, `Not a boolean, got '${typeof bool}'`);
  }
  return OK;
}

export function checkInterface(
  checkResults: CheckResult[],
  accessor: string
): CheckResult {
  const failedResults = checkResults.filter(isFailedCheckResult);
  if (failedResults.length > 0) {
    return failedCheck(
      accessor,
      failedResults.map(failedCheckToString).join(" AND ")
    );
  }
  return OK;
}

export function checkUnion(
  checkResults: CheckResult[],
  accessor: string
): CheckResult {
  const failedResults = checkResults.filter(isFailedCheckResult);
  if (failedResults.length === checkResults.length) {
    return failedCheck(
      accessor,
      failedResults.map(failedCheckToString).join(" AND ")
    );
  }
  return OK;
}

export function checkOptional(
  optional: any,
  onDefined: () => CheckResult
): CheckResult {
  if (optional !== undefined && optional !== null) {
    return onDefined();
  }
  return OK;
}

function createErrorMessageFromFailedChecks(failedChecks: FailedCheckResult[]) {
  const failedChecksString = failedChecks.map(failedCheckToString)
    .join(", ")
  return `Runtime types does not match expected types: ${failedChecksString}`
}

export class TypeCheckFailedError extends Error {}

export function assertType<T>(value: T, checkResults: CheckResult[]): T {
  const failedChecks: FailedCheckResult[] = checkResults.filter(
    isFailedCheckResult
  );
  if (failedChecks.length > 0) {
    throw new TypeCheckFailedError(createErrorMessageFromFailedChecks(failedChecks));
  }
  return value;
}
