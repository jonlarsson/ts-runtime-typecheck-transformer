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
  assertValidType,
  isType,
  any,
  nullValue,
  undefinedValue,
  RuntimeAssertTypeError,
} from "./validator";

export function runtimeIsType<T>(variable: any): variable is T {
  throw new Error("Transformer was not used when compiling");
}

export function runtimeAssertType<T>(variable: any): asserts variable is T {
  throw new Error("Transformer was not used when compiling");
}
