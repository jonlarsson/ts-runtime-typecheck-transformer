import { expect } from "chai";
import { describe } from "mocha";
import { runtimeTypecheck } from "ts-runtime-typecheck-validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";

describe("primitives", () => {
  describe("number", () => {
    it("should fail if the parameter is a string", () => {
      // @ts-ignore
      const a: number = "1";
      const actual = () => runtimeTypecheck(a);

      expectToThrowRuntimeTypecheckError(actual, "a", "number", "string");
    });

    it("should not fail if the parameter is a number", () => {
      const a: number = 1;
      const actual = () => runtimeTypecheck(a);

      expect(actual).not.to.throw();
    });
  });

  describe("boolean", () => {
    it("should fail if the parameter is a string", () => {
      // @ts-ignore
      const a: boolean = "true";
      const actual = () => runtimeTypecheck(a);

      expectToThrowRuntimeTypecheckError(actual, "a", "boolean", "string");
    });

    it("should not fail if the parameter is a boolean", () => {
      const a: boolean = true;
      const actual = () => runtimeTypecheck(a);

      expect(actual).not.to.throw();
    });
  });

  describe("string", () => {
    it("should fail if the parameter is a number", () => {
      // @ts-ignore
      const a: string = 1;
      const actual = () => runtimeTypecheck(a);

      expectToThrowRuntimeTypecheckError(actual, "a", "string", "number");
    });

    it("should not fail if the parameter is a string", () => {
      const a: string = "an actual string";
      const actual = () => runtimeTypecheck(a);

      expect(actual).not.to.throw();
    });
  });
});
