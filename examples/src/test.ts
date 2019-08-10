interface CheckResult {
  ok: boolean;
}

const OK: CheckResult = {
  ok: true
}

interface FailedCheckResult extends CheckResult {
  ok: false;
  accessor: string;
  error: string;
}

function failedCheck(accessor: string, error: string) {
  return {
    ok: false,
    error,
    accessor,
  }
}

function isFailedCheckResult(result: CheckResult): result is FailedCheckResult {
  return !result.ok;
}

function checkNumber(num: any, accessor: string): CheckResult | FailedCheckResult {
  if (typeof num !== "number") {
    return failedCheck(accessor, "Not a number");
  }
  return OK;
}

function checkString(str: any, accessor: string): CheckResult | FailedCheckResult {
  if (typeof str !== "string") {
    return failedCheck(accessor, "Not a string");
  }
  return OK;
}

function checkUnion(checkResults: CheckResult[], accessor: string): CheckResult | FailedCheckResult {
  const failedResults = checkResults
    .filter(isFailedCheckResult)
  if (failedResults.length === checkResults.length) {
    return failedCheck(accessor, failedResults
      .map(childResult => childResult.error)
      .join(" AND "))
  }
  return OK;
}

function checkOptional(optional: any, onDefined: () => CheckResult[]): CheckResult[] {
  if (optional !== undefined && optional !== null) {
    return onDefined();
  }
  return [];
}

function assertType(checkResults: CheckResult[]) {
  const failedChecks: FailedCheckResult[] = checkResults.filter(isFailedCheckResult);
  if (failedChecks.length > 0) {
    // Todo more descriptive message
    throw new Error("Some checks failed");
  }
}

export interface Ab {
  a: string;
  b: number;
}

export interface NumStr {
  optionalStr?: string;
  optionalBoth?: string | number;
  optionalAb?: Ab;
  nullableNum: number | null;
  num: number;
  str: string;
  ab: Ab;
  both: string | number;
}

// @validate
// hgehe
export function annotated(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}

export function noAnnotation(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}