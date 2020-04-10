import { runtimeTypecheck } from "@ts-rtc/validations";

export interface Ab {
  a: string;
  b: number;
  c: boolean;
}

export interface NumStr {
  optionalStr?: string;
  optionalBoth?: string | number;
  optionalAb?: Ab;
  nullableNum: number | null;
  num: number;
  str: string;
  ab: Ab;
  abOrString: string | Ab;
  both: string | number;
}

interface Pong {
  o: 1;
  ping: Ping;
}

interface Ping {
  i: number;
  pong: Pong;
}

interface Circular {
  name: string;
  child?: Circular;
}

function unsafeCall(): any {
  return {};
}

const a: Pong = unsafeCall();
runtimeTypecheck(a);
// const ape: NumStr = unsafeCall();
//
// runtimeTypecheck(ape);
//
// export function annotated(num: number, str: string, numstr: NumStr): void {
//   runtimeTypecheck(num, str, numstr);
//   console.log("a called", typeof num);
// }
//
// export function noAnnotation(num: number, str: string, numstr: NumStr): void {
//   console.log("a called", typeof num);
// }

// const a: {cow: NumStr} = unsafeCall();
// runtimeTypecheck(a);

// const array: [] = unsafeCall();
// runtimeTypecheck(array);
//
// const array2: number[] = unsafeCall();
// runtimeTypecheck(array2);
//
// const array3: NumStr[] = unsafeCall();
// runtimeTypecheck(array3);

// enum Num {
//   One = 1,
//   Two = 2
// }
//
// const num: Num = unsafeCall();
//
// runtimeTypecheck(num);

// const yes: true = unsafeCall();
// const no: false = unsafeCall();
//
// runtimeTypecheck(yes);
// runtimeTypecheck(no);

// interface A<T, X> {
//   a: T;
//   b: number;
//   c: X;
// }
//
// const aBool: A<boolean, Num> = unsafeCall();
//
// runtimeTypecheck(aBool);

// const array: number[] = unsafeCall();
// runtimeTypecheck(array);
