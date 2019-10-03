import { describe, it } from "mocha";
import { expect } from "chai";
import { checkOptional, FailOutcome } from "./validations";

describe("validations", () => {
  it("checkOptional should allow value to be undefined", () => {
    const actual = checkOptional(
      undefined,
      () => new FailOutcome("obj", "string", "undefined")
    );

    expect(actual.isOk()).to.be.true;
  });

  it("checkOptional should allow value to be null", () => {
    const actual = checkOptional(
      null,
      () => new FailOutcome("obj", "string", "undefined")
    );

    expect(actual.isOk()).to.be.true;
  });
});
