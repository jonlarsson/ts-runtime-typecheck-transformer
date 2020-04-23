import { expect } from "chai";
import { RuntimeAssertTypeError } from "@ts-rtc/validations";

export function expectToThrowRuntimeAssertTypeError(
  closure: () => void,
  accessor: string,
  expected: string,
  actual: string
) {
  expect(closure).to.throw();
  try {
    closure();
  } catch (error) {
    console.log(error.message);
    expect(error).to.be.instanceOf(RuntimeAssertTypeError);
    expect(error.message).to.contain(accessor);
    expect(error.message).to.contain(expected);
    expect(error.message).to.contain(actual);
  }
}
