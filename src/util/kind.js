export default function kindOf(v) {
  if (v === void (0)) return "undefined";
  if (v === null) return "null";
  let _type = typeof v;
  switch (_type) {
    case 'boolean':
    case 'function':
    case 'string':
    case 'symbol':
    case 'number':
    case 'bigint':
      return _type;
  }
  return v?.constructor?.name || "unknown";
}

export function isUndef(v) {
  return v === void (0) || v === null;
}