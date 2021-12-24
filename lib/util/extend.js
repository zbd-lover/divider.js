"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;

require("core-js/modules/es6.object.assign.js");

function extend(a, b, diff) {
  if (!a) return {};

  if (!diff) {
    return Object.assign(a, b);
  }

  let obj = {};
  Object.assign(obj, a);
  Object.assign(obj, b);
  return obj;
}