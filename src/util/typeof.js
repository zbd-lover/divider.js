const _toString = Object.prototype.toString;

export function __typeof__(v) {
  if (typeof v === 'undefined') {
    return 'undefined';
  }
  if (v === null) {
    return 'null';
  }
  const type = _toString.call(v).slice(8, -1).toLowerCase();
  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'array':
    case 'symbol':
    case 'function':
      return type;
    case 'object':
    default:
      return 'object';
  }
}
