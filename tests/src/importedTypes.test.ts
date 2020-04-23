import { expect } from "chai";
import { runtimeAssertType } from "@ts-rtc/validations";
import { expectToThrowRuntimeAssertTypeError } from "./expectToThrowRuntimeAssertTypeError";
import { AString } from "./exportedTypes";

describe("importedType", () => {
  it("should fail if a string property is a number", () => {
    // @ts-ignore
    const obj: AString = { a: 1 };

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(actual, "obj.a", "string", "number");
  });

  it("should not fail on correct property type", () => {
    const obj: AString = { a: "string" };

    const actual = () => runtimeAssertType(obj);

    expect(actual).not.to.throw();
  });
});
