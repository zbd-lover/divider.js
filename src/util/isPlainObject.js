import __typeof from "./typeof";

export default function isPlainObject(obj) {
  if (__typeof(obj) !== 'object') {
    return false;
  }
  return Object.getPrototypeOf(obj) === Object.prototype;
}