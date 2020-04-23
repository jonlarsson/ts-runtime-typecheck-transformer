import { expect } from "chai";
import { runtimeAssertType } from "@ts-rtc/validations";
import { expectToThrowRuntimeAssertTypeError } from "./expectToThrowRuntimeAssertTypeError";

describe("optionals", () => {
  it("should allow an optional primitive to be null", () => {
    const optional: number | null = null;

    const actual = () => runtimeAssertType(optional);

    expect(actual).not.to.throw();
  });

  it("should allow an optional primitive to be undefined", () => {
    const optional: string | undefined = undefined;

    const actual = () => runtimeAssertType(optional);

    expect(actual).not.to.throw();
  });

  it("should not allow an optional string to be a number", () => {
    //@ts-ignore
    const optional: string | undefined = 1;

    const actual = () => runtimeAssertType(optional);

    expectToThrowRuntimeAssertTypeError(actual, "optional", "string", "number");
  });

  it("should not allow a non optional primitive to be null", () => {
    // @ts-ignore
    const nonOptional: boolean = null;

    const actual = () => runtimeAssertType(nonOptional);

    expectToThrowRuntimeAssertTypeError(
      actual,
      "nonOptional",
      "boolean",
      "null"
    );
  });

  it("should not allow a non optional primitive to be undefined", () => {
    // @ts-ignore
    const nonOptional: boolean = undefined;

    const actual = () => runtimeAssertType(nonOptional);

    expectToThrowRuntimeAssertTypeError(
      actual,
      "nonOptional",
      "boolean",
      "undefined"
    );
  });

  it("should allow an optional property to be undefined", () => {
    const obj: { a?: number } = {};

    const actual = () => runtimeAssertType(obj);

    expect(actual).not.to.throw();
  });

  it("should not allow an optional property to have the wrong type", () => {
    //@ts-ignore
    const obj: { a?: number } = { a: true };

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(actual, "obj.a", "number", "boolean");
  });

  it("should not allow a non optional property to be undefined", () => {
    //@ts-ignore
    const obj: { a: number } = {};

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(actual, "obj.a", "number", "undefined");
  });
});
