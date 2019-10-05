export {
  assertType,
  checkBoolean,
  checkInterface,
  checkNumber,
  checkOptional,
  checkString,
  checkUnion,
  checkArray,
  checkBooleanLiteral,
  checkNumberLiteral,
  checkStringLiteral,
  TypeCheckFailedError
} from "./validations";

export function runtimeTypecheck(...variable: any): void {}
