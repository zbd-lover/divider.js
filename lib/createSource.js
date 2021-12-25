"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _extend = _interopRequireDefault(require("./util/extend"));

var _typeof2 = _interopRequireDefault(require("./util/typeof"));

var _verifyShape = _interopRequireDefault(require("./util/verifyShape"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultInsepctor = {
  enabled: false,
  error: true,
  interval: 2000,
  tolerance: 3
};
/**
 * @param {Function} process is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {source}
 */

function createSource(process, discrete, inspectorOption) {
  if ((0, _typeof2.default)(process) !== 'function') {
    throw new Error("Expected the process as a function. Instead, received: ".concat((0, _typeof2.default)(process)));
  }

  if ((0, _typeof2.default)(discrete) !== 'undefined' && (0, _typeof2.default)(discrete) !== 'object') {
    inspectorOption = discrete;
  }

  let _inspectorOption;

  if (inspectorOption && (0, _typeof2.default)(inspectorOption) !== 'object') {
    throw new Error("Expected the inspect as a object. Instead, received: ".concat((0, _typeof2.default)(inspectorOption)));
  } else {
    _inspectorOption = (0, _extend.default)((0, _extend.default)({}, defaultInsepctor), inspectorOption || {});
  }

  let nextListeners = [];
  /**
   * Adds a listener for specified action,
   * it's called when the specified action is dispatched, then,
   * 'datasoure' and 'action' will as parameter pass to it.
   * @param {string} type decription of action
   * @param {Function} listener your specified listener
   * @returns {Function} Function A remove the specified listener
   */

  function addTaskListener(type, listener) {
    if ((0, _typeof2.default)(type) !== "string") {
      throw new Error("Parameter called task expects a string, but received: ".concat((0, _typeof2.default)(type)));
    }

    let _listener = {
      target: type,
      callback: listener
    };
    nextListeners.push(_listener);
    let listening = true;
    return () => {
      if (!listening) {
        return;
      }

      listening = false;
      let index = nextListeners.indexOf(_listener);

      if (index >= 0) {
        nextListeners.splice(index, 1);
      }
    };
  }
  /** state machine's uid */


  let suid = 0;
  /**
   * Creates a state machine when a action is dispatched.
   * Each task should own respective state machine,
   * so we can be able to observe status of each task.
   * @returns {StateMachine} hook, start and end, they are functions.
   * start and end is used for marking processor's status.
   * hook let's do something before processor works or after worked
   */

  function creatStateMachine() {
    let hooks = [];
    let processing = false;

    function start(effect) {
      if (processing) {
        throw new Error('');
      }

      if ((0, _typeof2.default)(hooks[0]) === 'function') {
        hooks[0]();
      }

      processing = true;

      if (effect) {
        effect();
      }
    }

    function end(effect) {
      if (!processing) {
        throw new Error('');
      }

      if ((0, _typeof2.default)(hooks[1]) === 'function') {
        hooks[1]();
      }

      processing = false;

      if (effect) {
        effect();
      }
    }

    function hook(tag, fn) {
      if ((0, _typeof2.default)(tag) === 'undefined') {
        hooks = [];
        return;
      }

      let index = tag;

      if ((0, _typeof2.default)(index) !== 'number') {
        if (index === 'before') {
          index = 0;
          return;
        }

        if (index === 'after') {
          index = 1;
          return;
        }

        throw new Error("Invalid tag as string, valid tag is one of 'after' or'before'.");
      }

      if (index === 0 || index === 1) {
        if ((0, _typeof2.default)(fn) === 'undefined') {
          hooks[index] = undefined;
        } else if ((0, _typeof2.default)(fn) === 'function') {
          hooks[index] = fn;
        } else {
          throw new Error("Expected the fn as function. Instead, received: ".concat((0, _typeof2.default)(fn), "."));
        }
      } else {
        throw new Error("Invalid tag as number, valid tag is one of '0' or '1'.");
      }
    }

    suid++;
    return {
      hook,
      start,
      end,
      uid: suid
    };
  }

  function createInspector() {
    // It's used for verifing 'dispatch times' and 'response times' are matched.
    // [ [0, 1], [0, null], [0, 1] ]
    const couples = []; // to avoid making bad effect program

    const life = 100;
    const suspects = new Array(life).fill(0);
    let timer;
    setTimeout(() => timer = setInterval(() => verifyTimes(), _inspectorOption.interval));

    function verifyTimes() {
      if (couples.length >= life) {
        clearInterval(timer);
        return;
      }

      couples.forEach((couple, index) => {
        if (couple[0] === 0 && couple[1] !== 1) {
          suspects[index]++;
          return;
        }

        suspects[index] = 0;
      });

      if (suspects.some(suspect => suspect >= _inspectorOption.tolerance)) {
        const text = "\n          You maybe forget to call 'notify' in 'process' function.\n          It's maybe make bad effect for your 'hook for dispatch',\n          or source is 'sequence', yet.\n        ";

        if (_inspectorOption.error) {
          throw new Error(text);
        }

        console.warn(text);
      }
    }

    function collect(index, flag) {
      if (!couples[index]) {
        couples[index] = [];
      }

      couples[index][flag] = flag;
    }

    return {
      collect
    };
  }

  let inspector = _inspectorOption.enabled ? createInspector() : null;
  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false only happened at time notify called,
   * otherwise, after action dispatched.
   */

  let waiting = false;
  /**
   * Create a dispatch and hook of one task.
   * @param {string} type to describe what is the action.
   * @returns {object} dispatch, hook
   * if the type specified as string, parameter called action of the dispatch always own 'type' key with the string
   */

  function createTask(type) {
    if ((0, _typeof2.default)(type) === 'string' && !type) {
      throw new Error("Expected the type is not empty as a string. Instead, receive: ".concat(type));
    }

    const {
      hook,
      start,
      end,
      uid
    } = creatStateMachine();

    const createNotify = action => datasource => {
      end(() => {
        if (inspector) {
          inspector.collect(uid, 1);
        }

        if (!discrete) {
          waiting = false;
        }
      });
      let currentListeners = nextListeners.filter(listener => listener.target === action.type);

      try {
        currentListeners.forEach(listener => listener.callback(datasource, action));
      } catch (e) {
        console.log(e);
      }
    };

    const dispatch = action => {
      (0, _verifyShape.default)(action, ['type'], 'action');

      if (!discrete && waiting) {
        throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter\n          called 'discrete' of 'createSource'.\n        ");
      }

      let _action = (0, _extend.default)({}, action);

      _action.type = type ? type : action.type;
      start(() => {
        waiting = true;

        if (inspector) {
          inspector.collect(uid, 0);
        }

        process(_action, createNotify(_action));

        if (discrete) {
          waiting = false;
        }
      });
    };

    return [dispatch, hook];
  }

  function dispatchAsync(action) {
    return createTask()[0](action);
  }

  const [dispatchSync, syncHook] = createTask();
  const dispatch = discrete ? dispatchAsync : dispatchSync;

  function isDiscrete() {
    return discrete;
  }

  function isWaiting() {
    return waiting;
  }

  const source = {
    dispatch,
    isDiscrete,
    isWaiting,
    createTask,
    addTaskListener
  };

  if (!discrete) {
    source.hook = syncHook;
  }

  return source;
}

createSource(() => {});
var _default = createSource;
exports.default = _default;