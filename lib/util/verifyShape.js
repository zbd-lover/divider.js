"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = verifyShape;

var _isPlainObject = _interopRequireDefault(require("./isPlainObject"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const hasOwn = Object.prototype.hasOwnProperty;
/**
 * @param {object} obj 
 * @param {Array<String>} shape 
 */

function verifyShape(obj, shape, host) {
  if ((0, _isPlainObject.default)(obj)) {
    if (shape.some(key => !hasOwn.call(obj, key))) {
      throw new Error("Expected the ".concat(host || 'obj', " must own keys: ").concat(shape.join(' ')));
    }
  }
}