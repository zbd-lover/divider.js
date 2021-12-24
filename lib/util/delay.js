"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = delay;

function delay(fn) {
  return () => {
    fn();
  };
}