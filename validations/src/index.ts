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

export {
  array,
  createValidator,
  or,
  props,
  resultAsString,
  str,
  num,
  bool,
  value,
  assertValidType
} from "./validator";

export function runtimeTypecheck(...variable: any): void {}
