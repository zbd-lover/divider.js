"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;

var _isPlainObject = _interopRequireDefault(require("./isPlainObject"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function extend(a, b) {
  if (!(0, _isPlainObject.default)(a) || !(0, _isPlainObject.default)(b)) {
    throw new Error("Expected the a and b both are plain object.");
  }

  let result = {};

  for (let key in a) {
    result[key] = a[key];
  }

  for (let key in b) {
    result[key] = b[key];
  }

  return result;
}