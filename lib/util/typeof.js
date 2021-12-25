"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _typeof;
const _toString = Object.prototype.toString;

function _typeof(v) {
  if (typeof v === 'undefined' || v === null) {
    return 'undefined';
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