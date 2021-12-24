"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _delay = _interopRequireDefault(require("./util/delay"));

var _extend = _interopRequireDefault(require("./util/extend"));

var _compareAndRun = _interopRequireDefault(require("./util/compareAndRun"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createSource(process) {
  let discrete = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  let currentListeners = [];
  let nextListeners = [];
  let currentStatus = null;

  function addActionListener(type, listener) {
    if (typeof type !== "string") {
      throw new Error("type expects a string, but received: ".concat(typeof type));
    }

    nextListeners.push({
      target: type,
      callback: listener
    });
    return () => {
      let index = nextListeners.findIndex(lis => lis === listener);

      if (index >= 0) {
        nextListeners.splice(index, 1);
      }
    };
  }

  function decorateListener(listener, callback) {
    return (datasource, action) => {
      listener.callback(datasource, action);
      callback && callback();
    };
  }

  function makeDispatch(action, description) {
    const status = (0, _extend.default)({
      processing: false
    }, description);

    const startProcess = fn => {
      status.processing = true;
      fn();
    };

    const endProcess = () => {
      status.processing = false;
      if (currentStatus === status) {
        currentStatus = null;
      }
    };

    // 这个地方可能有问题，currentListeners应该是快照
    const notify = datasource => {
      currentListeners = nextListeners.filter(listener => listener.target === action.type);
      const len = currentListeners.length;
      currentListeners = currentListeners.map((listener, index) => discrete ? decorateListener(listener) : decorateListener(listener, (0, _delay.default)(() => (0, _compareAndRun.default)(index, len - 1, endProcess))));      try {
        currentListeners.forEach(listener => listener(datasource, action));
      } catch (e) {
        console.log(e);
      }
    };

    return () => {
      console.log(currentStatus, status)
      if (!discrete && currentStatus && currentStatus.processing) {
        throw new Error("\n          Can't dispatch action while synchronous source is being processed,\n          if 'discrete dispatching' is expected, pass 'true' to parameter called 'discrete' of function 'createSource'.\n        ");
      }

      currentStatus = status;
      startProcess(() => process(action, notify));

      if (discrete) {
        endProcess();
      }

      return status;
    };
  }

  function dispatch(action, description) {
    return makeDispatch(action, description)();
  }

  return {
    dispatch,
    makeDispatch,
    addActionListener
  };
}

var _default = createSource;
exports.default = _default;