import { expect } from "chai";
import { runtimeTypecheck } from "@ts-rtc/validations";
import { expectToThrowRuntimeTypecheckError } from "./expectToThrowRuntimeTypecheckError";

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
      ping: { type: "ping" }
    };

    const actual = () => runtimeTypecheck(pong);

    expect(actual).not.to.throw();
  });

  it("should perform recursive type checks", () => {
    const pong: Pong = {
      type: "pong",
      ping: {
        type: "ping",
        // @ts-ignore
        pong: {
          type: "pong",
          ping: { type: "pang" }
        }
      }
    };

    const actual = () => runtimeTypecheck(pong);

    expectToThrowRuntimeTypecheckError(
      actual,
      "pong.ping.pong.ping.type",
      "ping",
      "pang"
    );
  });
});
