function assertIsNumber(num: any): void {
  if (typeof num !== "number") {
    throw new Error("Not a number");
  }
}

function assertIsString(string: any): void {
  if (typeof string !== "string") {
    throw new Error("Not a string");
  }
}

export interface Ab {
  a: string;
  b: number;
}

export interface NumStr {
  num: number;
  str: string;
  ab: Ab;
  both: string | number;
}

// @validate
// hgehe
export function annotated(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}

export function noAnnotation(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}