import { describe, it } from "mocha";
import { expect } from "chai";
import {
  createValidator,
  or,
  props,
  resultAsString,
  str,
  value
} from "./validator";

interface Circular {
  a: string;
  child: Circular | null;
}

describe("validator", () => {
  it("should allow circular types", () => {
    const validValue: Circular = {
      a: "a",
      child: {
        a: "b",
        child: null
      }
    };

    const invalidValue = {
      a: "a",
      child: {
        b: "b",
        child: null
      }
    };

    const validator = createValidator((index, provider) => {
      return index(
        "Circular",
        props(
          ["a", value => value.a, str],
          ["child", value => value.child, or(value(null), provider("Circular"))]
        )
      );
    });

    const validResult = validator(validValue);
    console.log(resultAsString(validResult, "foo"));
    expect(validResult.valid).to.eq(true);
    const invalidResult = validator(invalidValue);
    console.log(resultAsString(invalidResult, "foo"));
    expect(invalidResult.valid).to.eq(false);
  });
});
