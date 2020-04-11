import { expect } from "chai";
import { runtimeTypecheck } from "@ts-rtc/validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";

describe("enums", () => {
  describe("number enum", () => {
    enum Num {
      One = 1,
      Two = 2
    }

    it("should not allow a number that is not a member of the enum", () => {
      // @ts-ignore
      const num: Num = 3;

      const actual = () => runtimeTypecheck(num);

      expectToThrowRuntimeTypecheckError(actual, "num", "1", "3");
      expectToThrowRuntimeTypecheckError(actual, "num", "2", "3");
    });

    it("should not allow a value that is not the correct type", () => {
      // @ts-ignore
      const num: Num = "2";

      const actual = () => runtimeTypecheck(num);

      expectToThrowRuntimeTypecheckError(actual, "num", "number", "string");
      expectToThrowRuntimeTypecheckError(actual, "num", "number", "string");
    });

    it("should allow a number that is a member of the enum", () => {
      const num: Num = Num.Two;

      const actual = () => runtimeTypecheck(num);

      expect(actual).not.to.throw();
    });
  });

  describe("string enum", () => {
    enum Str {
      A = "a",
      B = "b"
    }

    it("should not allow a string that is not a member of the enum", () => {
      // @ts-ignore
      const str: Str = "c";

      const actual = () => runtimeTypecheck(str);

      expectToThrowRuntimeTypecheckError(actual, "str", "a", "c");
      expectToThrowRuntimeTypecheckError(actual, "str", "b", "c");
    });

    it("should not allow a value that is not the correct type", () => {
      // @ts-ignore
      const str: Str = 1;

      const actual = () => runtimeTypecheck(str);

      expectToThrowRuntimeTypecheckError(actual, "str", "a", "1");
    });

    it("should allow a string that is a member of the enum", () => {
      const num: Str = Str.A;

      const actual = () => runtimeTypecheck(num);

      expect(actual).not.to.throw();
    });
  });
});
