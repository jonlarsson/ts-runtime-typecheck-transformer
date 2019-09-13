import { runtimeTypecheck } from "ts-runtime-typecheck-validations";

describe("interfaces", () => {
  it("should fail if a boolean property is a number", () => {
    interface Obj {
      a: boolean;
      b: number;
    }
    // @ts-ignore
    const obj: Obj = { a: 1, b: 2 };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).toThrowError("obj.a: Not a boolean");
  });

  it("should not fail on correct property type", () => {
    interface Obj {
      a: boolean;
      b: number;
    }
    const obj: Obj = { a: true, b: 2 };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).not.toThrow();
  });

  it("should fail if a nested boolean number is a string", () => {
    interface Nested {
      a: boolean;
    }
    interface Obj {
      nested: Nested;
    }
    //@ts-ignore
    const obj: Obj = { nested: { a: "true" } };

    const actual = () => runtimeTypecheck(obj);

    expect(actual).toThrowError("obj.nested.a: Not a boolean");
  });
});
