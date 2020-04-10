import { describe, it } from "mocha";
import { expect } from "chai";
import {
  array,
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
  arr: Circular[];
}

interface Pong {
  o: 1;
  ping?: Ping;
}

interface Ping {
  i: 1;
  pong: Pong;
}

describe("validator", () => {
  it("should allow circular types", () => {
    const validValue: Circular = {
      a: "a",
      child: {
        a: "b",
        child: null,
        arr: []
      },
      arr: [{ a: "c", child: null, arr: [] }]
    };

    const ping: Ping = {
      i: 1,
      pong: {
        o: 1
      }
    };

    const invalidValue = {
      a: "a",
      child: {
        b: "b",
        child: null
      },
      arr: [{ a: "c", child: null, arr: null }]
    };

    const validator = createValidator((index, provider) => {
      return index(
        "Circular",
        props(
          ["a", value => value.a, str],
          [
            "child",
            value => value.child,
            or(value(null), provider("Circular"))
          ],
          ["arr", value => value.arr, array(provider("Circular"))]
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
