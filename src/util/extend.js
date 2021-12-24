import isPlainObject from "./isPlainObject";

export default function extend(a, b) {
  if (!isPlainObject(a) || !isPlainObject(b)) {
    throw new Error(
      `Expected the a and b both are plain object.`
    );
  }
  return extend(extend({}, a), b);
}