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
}

export type CheckResult = PassedCheckResult | FailedCheckResult;

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
    return failedCheck(accessor, "Not a number");
  }
  return OK;
}

export function checkString(str: any, accessor: string): CheckResult {
  if (typeof str !== "string") {
    return failedCheck(accessor, "Not a string");
  }
  return OK;
}

export function checkBoolean(bool: any, accessor: string): CheckResult {
  if (typeof bool !== "boolean") {
    return failedCheck(accessor, "Not a boolean");
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
      failedResults.map(childResult => childResult.error).join(" AND ")
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
      failedResults.map(childResult => childResult.error).join(" AND ")
    );
  }
  return OK;
}

export function checkOptional(
  optional: any,
  onDefined: () => CheckResult[]
): CheckResult[] {
  if (optional !== undefined && optional !== null) {
    return onDefined();
  }
  return [];
}

export function assertType(checkResults: CheckResult[]) {
  const failedChecks: FailedCheckResult[] = checkResults.filter(
    isFailedCheckResult
  );
  if (failedChecks.length > 0) {
    // Todo more descriptive message
    throw new Error("Some checks failed");
  }
}
