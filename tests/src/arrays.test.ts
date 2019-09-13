import { runtimeTypecheck } from "ts-runtime-typecheck-validations";

describe("optionals", () => {
  it("should not allow an object that is not an array", () => {
    //@ts-ignore
    const obj: number[] = {};

    const actual = () => runtimeTypecheck(obj);

    expect(actual).toThrowError("obj: Not an array");
  });

  it("should allow an empty array", () => {
    const array: number[] = [];

    const actual = () => runtimeTypecheck(array);

    expect(actual).not.toThrow();
  });

  it("should not allow an array item of wrong type", () => {
    //@ts-ignore
    const array: number[] = [false];

    const actual = () => runtimeTypecheck(array);

    expect(actual).toThrowError("array[0]: Not a number");
  });
});
