import { expect } from "chai";
import { describe, it } from "mocha";
import { runtimeTypecheck } from "@ts-rtc/validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";

describe("arrays", () => {
  it("should not allow an object that is not an array", () => {
    //@ts-ignore
    const obj: number[] = {};

    const actual = () => runtimeTypecheck(obj);

    expectToThrowRuntimeTypecheckError(actual, "obj", "Array", "object");
  });

  it("should allow an empty array", () => {
    const array: number[] = [];

    const actual = () => runtimeTypecheck(array);

    expect(actual).not.to.throw();
  });

  it("should not allow an array item of wrong type", () => {
    //@ts-ignore
    const array: number[] = [false];

    const actual = () => runtimeTypecheck(array);

    expectToThrowRuntimeTypecheckError(actual, "array[0]", "number", "boolean");
  });

  it("should allow arrays with any items", () => {
    const array: [] = [];

    const actual = () => runtimeTypecheck(array);

    expect(actual).not.to.throw();
  });

  it("should not allow an object array item with wrong member", () => {
    //@ts-ignore
    const array: { num: number }[] = [{ num: 1 }, { num: false }];

    const actual = () => runtimeTypecheck(array);

    expectToThrowRuntimeTypecheckError(
      actual,
      "array[1].num",
      "number",
      "boolean"
    );
  });
});
