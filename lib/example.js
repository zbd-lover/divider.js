"use strict";

var _createSource = _interopRequireDefault(require("./createSource"));

var _process = _interopRequireDefault(require("./process"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const source = (0, _createSource.default)(_process.default, true);
source.addActionListener("update", (ds) => {
  console.log("查询的数据:", ds);
});

var s1 = source.dispatch({
  type: "update",
  payload: "新的名称",
});

setTimeout(() => {

  var s2 = source.dispatch({
    type: "update",
    payload: "新的名称112325"
  });
}, 500)


const dp = source.makeDispatch({});