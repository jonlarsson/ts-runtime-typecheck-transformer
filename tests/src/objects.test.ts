import { expect } from "chai";
import { runtimeAssertType } from "@ts-rtc/validations";
import { expectToThrowRuntimeAssertTypeError } from "./expectToThrowRuntimeAssertTypeError";

describe("interfaces", () => {
  it("should fail if a boolean property is a number", () => {
    interface Obj {
      a: boolean;
      b: number;
    }
    // @ts-ignore
    const obj: Obj = { a: 1, b: 2 };

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(actual, "obj.a", "boolean", "number");
  });

  it("should not fail on correct property type", () => {
    interface Obj {
      a: boolean;
      b: number;
    }
    const obj: Obj = { a: true, b: 2 };

    const actual = () => runtimeAssertType(obj);

    expect(actual).not.to.throw();
  });

  it("should fail if a nested boolean number is a string", () => {
    interface Nested {
      a: boolean;
    }
    interface Obj {
      nested: Nested;
    }
    //@ts-ignore
    const obj: Obj = { nested: { a: "true" } };

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(
      actual,
      "obj.nested.a",
      "boolean",
      "string"
    );
  });

  it("should fail on a property needing property access", () => {
    interface Obj {
      "_@test": boolean;
    }
    // @ts-ignore
    const obj: Obj = { "_@test": 1 };

    const actual = () => runtimeAssertType(obj);

    expectToThrowRuntimeAssertTypeError(
      actual,
      'obj["_@test"]',
      "boolean",
      "number"
    );
  });
});
