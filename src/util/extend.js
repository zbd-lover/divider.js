import isPlainObject from "./isPlainObject";

export default function extend(a, b) {
  if (!isPlainObject(a) || !isPlainObject(b)) {
    throw new Error(
      `Expected the a and b both are plain object.`
    );
  }
  let result = {};
  for (let key in a) {
    result[key] = a[key];
  }
  for (let key in b) {
    result[key] = b[key]
  }
  return result;
}