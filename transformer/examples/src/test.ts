import { runtimeTypecheck } from "ts-runtime-typecheck-validations";

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

function unsafeCall(): any {
  return {};
}
// const ape: NumStr = unsafeCall();
//
// runtimeTypecheck(ape)
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

const array: [] = unsafeCall();
runtimeTypecheck(array);

const array2: number[] = unsafeCall();
runtimeTypecheck(array2);

const array3: NumStr[] = unsafeCall();
runtimeTypecheck(array3);
