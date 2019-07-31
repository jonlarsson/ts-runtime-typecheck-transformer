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

export interface NumStr {
  num: number;
  str: string;
}
export function a(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}