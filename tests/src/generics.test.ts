import { expect } from "chai";
import { runtimeTypecheck } from "@ts-rtc/validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";

describe("generics", () => {
  it("should fail if a boolean property is a number", () => {
    interface Obj<T> {
      a: T;
      b: number;
    }
    // @ts-ignore
    const obj: Obj<boolean> = { a: 1, b: 2 };

    const actual = () => runtimeTypecheck(obj);

    expectToThrowRuntimeTypecheckError(actual, "obj.a", "boolean", "number");
  });

  it("should succeed with the correct generic type", () => {
    interface Obj<T> {
      a: T;
      b: number;
    }
    const obj: Obj<boolean> = { a: true, b: 2 };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).not.to.throw();
  });
});
