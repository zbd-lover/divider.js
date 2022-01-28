import { isUndef } from "./kind";

export default function isPlainObject(v) {
  if (isUndef(v)) return false;
  if (typeof v !== 'object') return false;
  let baseV = Object.getPrototypeOf(v);
  return baseV === Object.prototype;
}