import { runtimeTypecheck } from 'ts-runtime-typecheck-validations'

describe("primitives", () => {
  describe("number", () => {
    it("should fail if the parameter is a string", () => {
      // @ts-ignore
      const a: number = "1";
      const actual = () => runtimeTypecheck(a)

      expect(actual).toThrowError("a: Not a number");
    });

    it("should not fail if the parameter is a number", () => {
      const a: number = 1;
      const actual = () => runtimeTypecheck(a)

      expect(actual).not.toThrow();
    })
  });

  describe("boolean", () => {
    it("should fail if the parameter is a string", () => {
      // @ts-ignore
      const a: boolean = "true";
      const actual = () => runtimeTypecheck(a)

      expect(actual).toThrowError("a: Not a boolean");
    });

    it("should not fail if the parameter is a boolean", () => {
      const a: boolean = true;
      const actual = () => runtimeTypecheck(a)

      expect(actual).not.toThrow();
    })
  });

  describe("string", () => {
    it("should fail if the parameter is a number", () => {
      // @ts-ignore
      const a: string = 1;
      const actual = () => runtimeTypecheck(a)

      expect(actual).toThrowError("a: Not a string");
    });

    it("should not fail if the parameter is a string", () => {
      const a: string = "an actual string";
      const actual = () => runtimeTypecheck(a)

      expect(actual).not.toThrow();
    })
  });
})