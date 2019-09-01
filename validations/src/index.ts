export {
  CheckResult,
  FailedCheckResult,
  PassedCheckResult,
  assertType,
  checkBoolean,
  checkInterface,
  checkNumber,
  checkOptional,
  checkString,
  checkUnion
} from "./validations";

export function runtimeTypecheck(...variable: any): void {}
