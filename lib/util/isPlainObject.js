"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isPlainObject;

var _typeof = _interopRequireDefault(require("./typeof"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isPlainObject(obj) {
  if ((0, _typeof.default)(obj) !== 'object') {
    return false;
  }

  return Object.getPrototypeOf(obj) === Object.prototype;
}