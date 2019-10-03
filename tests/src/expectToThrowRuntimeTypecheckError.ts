import { expect } from "chai";
import { TypeCheckFailedError } from "@ts-rtc/validations";

export function expectToThrowRuntimeTypecheckError(
  closure: () => void,
  accessor: string,
  expected: string,
  actual: string
) {
  expect(closure).to.throw();
  try {
    closure();
  } catch (error) {
    expect(error).to.be.instanceOf(TypeCheckFailedError);
    expect(error.message).to.contain(accessor);
    expect(error.message).to.contain(expected);
    expect(error.message).to.contain(actual);
  }
}
