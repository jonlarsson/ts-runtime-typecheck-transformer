import { expect } from "chai";
import { runtimeAssertType } from "@ts-rtc/validations";
import { expectToThrowRuntimeAssertTypeError } from "./expectToThrowRuntimeAssertTypeError";

describe("circular", () => {
  interface Pong {
    type: "pong";
    ping: Ping;
  }

  interface Ping {
    type: "ping";
    pong?: Pong;
  }
  it("should allow circular type references", () => {
    const pong: Pong = {
      type: "pong",
      ping: { type: "ping" },
    };

    const actual = () => runtimeAssertType(pong);

    expect(actual).not.to.throw();
  });

  it("should perform recursive type checks", () => {
    const pong: Pong = {
      type: "pong",
      ping: {
        type: "ping",
        pong: {
          type: "pong",
          // @ts-ignore
          ping: { type: "pang" },
        },
      },
    };

    const actual = () => runtimeAssertType(pong);

    expectToThrowRuntimeAssertTypeError(
      actual,
      "pong.ping.pong.ping.type",
      "ping",
      "pang"
    );
  });
});
