export interface Ab {
  a: string;
  b: number;
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

// @validate
// hgehe
export function annotated(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}

export function noAnnotation(num: number, str: string, numstr: NumStr): void {
  console.log("a called", typeof num);
}