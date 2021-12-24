"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = compareAndRun;

function compareAndRun(a, b, fn) {
  if (a === b) {
    fn();
  }
}