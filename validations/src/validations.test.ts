import {
  checkArray,
  failedCheck,
  isFailedCheckResult,
  OK
} from "./validations";
import { checkBoolean } from "./validations";

describe("validations", () => {
  describe("checkArray", () => {
    it("should fail check for a non array value", () => {
      const actual = checkArray({}, "notArray", () => OK);

      expect(isFailedCheckResult(actual)).toBe(true);
      if (isFailedCheckResult(actual)) {
        expect(actual.error).toMatch("Not an array, got 'object'");
      }
    });

    it("should pass check for an empty array", () => {
      const actual = checkArray([], "emtpyArray", () =>
        failedCheck("emptyArray", "Failed item")
      );

      expect(isFailedCheckResult(actual)).toBe(false);
    });

    it("should pass any values when item check is not supplied", () => {
      const actual = checkArray([false, null, undefined], "emtpyArray");

      expect(isFailedCheckResult(actual)).toBe(false);
    });

    it("should fail check if any item fails item check", () => {
      const actual = checkArray([true, 1, false], "boolNumBool", value =>
        checkBoolean(value, "value")
      );

      expect(isFailedCheckResult(actual)).toBe(true);
      if (isFailedCheckResult(actual)) {
        expect(actual.error).toMatch(
          "boolNumBool[1]: Not a boolean, got 'number'"
        );
      }
    });
  });
});
