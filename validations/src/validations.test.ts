import { checkOptional, FailOutcome } from "./validations";

describe("validations", () => {
  it("checkOptional should allow value to be undefined", () => {
    const actual = checkOptional(
      undefined,
      () => new FailOutcome("obj", "string", "undefined")
    );

    expect(actual.isOk()).toBe(true);
  });

  it("checkOptional should allow value to be null", () => {
    const actual = checkOptional(
      null,
      () => new FailOutcome("obj", "string", "undefined")
    );

    expect(actual.isOk()).toBe(true);
  });
});
