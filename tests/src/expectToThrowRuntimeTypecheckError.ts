import { TypeCheckFailedError } from "ts-runtime-typecheck-validations/dest/validations";

export function expectToThrowRuntimeTypecheckError(
  closure: () => void,
  accessor: string,
  expected: string,
  actual: string
) {
  expect(closure).toThrowError();
  try {
    closure();
  } catch (error) {
    expect(error).toBeInstanceOf(TypeCheckFailedError);
    expect(error.message).toMatch(accessor);
    expect(error.message).toMatch(expected);
    expect(error.message).toMatch(actual);
  }
}
