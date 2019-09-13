import { runtimeTypecheck } from "ts-runtime-typecheck-validations";

describe("optionals", () => {
  it("should allow an optional primitive to be null", () => {
    const optional: number | null = null;

    const actual = () => runtimeTypecheck(optional);

    expect(actual).not.toThrow();
  });

  it("should allow an optional primitive to be undefined", () => {
    const optional: string | undefined = undefined;

    const actual = () => runtimeTypecheck(optional);

    expect(actual).not.toThrow();
  });

  it("should not allow an optional primitive to be undefined", () => {
    //@ts-ignore
    const optional: string | undefined = 1;

    const actual = () => runtimeTypecheck(optional);

    expect(actual).toThrowError("optional: Not a string");
  });

  it("should not allow a non optional primitive to be null", () => {
    // @ts-ignore
    const nonOptional: boolean = null;

    const actual = () => runtimeTypecheck(nonOptional);

    expect(actual).toThrowError("nonOptional: Not a boolean");
  });

  it("should not allow a non optional primitive to be undefined", () => {
    // @ts-ignore
    const nonOptional: boolean = undefined;

    const actual = () => runtimeTypecheck(nonOptional);

    expect(actual).toThrowError("nonOptional: Not a boolean");
  });

  it("should allow an optional property to be undefined", () => {
    const obj: { a?: number } = {};

    const actual = () => runtimeTypecheck(obj);

    expect(actual).not.toThrow();
  });

  it("should not allow an optional property to have the wrong type", () => {
    //@ts-ignore
    const obj: { a?: number } = { a: true };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).toThrowError("obj.a: Not a number");
  });

  it("should not allow a non optional property to be undefined", () => {
    //@ts-ignore
    const obj: { a: number } = {};

    const actual = () => runtimeTypecheck(obj);

    expect(actual).toThrowError("obj.a: Not a number");
  });
});
