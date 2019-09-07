import { runtimeTypecheck } from 'ts-runtime-typecheck-validations'

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

  it("should not allow a non optional primitive to be null", () => {
    // @ts-ignore
    const nonOptional: boolean = null;

    const actual = () => runtimeTypecheck(nonOptional);

    expect(actual).toThrowError("nonOptional: Not a boolean")
  });

  it("should not allow a non optional primitive to be undefined", () => {
    // @ts-ignore
    const nonOptional: boolean = undefined;

    const actual = () => runtimeTypecheck(nonOptional);

    expect(actual).toThrowError("nonOptional: Not a boolean")
  });
})