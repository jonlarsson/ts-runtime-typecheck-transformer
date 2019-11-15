import { expect } from "chai";
import { runtimeTypecheck } from "@ts-rtc/validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";
import { AString } from "./exportedTypes";

describe("importedType", () => {
  it("should fail if a string property is a number", () => {
    // @ts-ignore
    const obj: AString = { a: 1 };

    const actual = () => runtimeTypecheck(obj);

    expectToThrowRuntimeTypecheckError(actual, "obj.a", "string", "number");
  });

  it("should not fail on correct property type", () => {
    interface Obj {
      a: boolean;
      b: number;
    }
    const obj: AString = { a: "string" };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).not.to.throw();
  });
});
