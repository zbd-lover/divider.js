"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;

const makeAsyncProcessor = () => {
  let obj = {
    name: "zbd",
  };

  const update = (name) => {
    return new Promise((rs, rj) => {
      setTimeout(() => {
        obj.name = name;
        rs();
      }, 1000);
    });
  };

  const query = () => {
    return new Promise((rs, rj) => {
      setTimeout(() => {
        rs(obj.name + "," + new Date().getDate());
      }, 500);
    });
  };

  return async (action, notify) => {
    await update(action.payload);
    notify(await query(), action);
  };
};

var _default = makeAsyncProcessor();

exports.default = _default;
