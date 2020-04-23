import { expect } from "chai";
import { runtimeAssertType } from "@ts-rtc/validations";
import { expectToThrowRuntimeAssertTypeError } from "./expectToThrowRuntimeAssertTypeError";

describe("inferredTypes", () => {
  it("should not allow number when string is inferred from function parameter type", () => {
    // @ts-ignore
    const array: string[] = [1];

    const actual = () => array.forEach((item) => runtimeAssertType(item));

    expectToThrowRuntimeAssertTypeError(actual, "item", "string", "number");
  });

  it("should allow string when string is inferred", () => {
    // @ts-ignore
    const array: string[] = ["astring"];

    const actual = () => array.forEach((item) => runtimeAssertType(item));

    expect(actual).not.to.throw;
  });
});
