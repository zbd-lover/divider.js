
export default function extend(a, b, diff) {
  if (!a) return {};
  if (!diff) {
    return Object.assign(a, b);
  }
  let obj = {}
  Object.assign(obj, a)
  Object.assign(obj, b);
  return obj;
}
