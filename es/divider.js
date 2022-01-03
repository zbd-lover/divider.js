function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var _toString = Object.prototype.toString;
function _typeof(v) {
  if (typeof v === 'undefined' || v === null) {
    return 'undefined';
  }

  var type = _toString.call(v).slice(8, -1).toLowerCase();

  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'array':
    case 'symbol':
    case 'function':
      return type;

    case 'object':
    default:
      return 'object';
  }
}

/**
 * @param {Array<any>} arr 
 * @returns Array<any>
 */

function filterNullValues(arr) {
  if (_typeof(arr) !== 'array') {
    return [];
  }

  return arr.filter(function (item) {
    return !!item;
  });
}

var forkOption = {
  enabled: [true, false],
  error: [true, false],
  interval: [1000, 1000],
  tolerance: [3, 3]
};

function extractOption(index) {
  var option = {};

  for (var key in forkOption) {
    option[key] = forkOption[key][index];
  }

  return option;
}

function getProdOption() {
  return extractOption(0);
}

function getDevOption() {
  return extractOption(1);
}
/**
 * Normally, one dispatch means one response.
 * Inspector will check Is the number of dispatch consistent with the number of response.
 * In productin environent,enabled by default, it will throw error if not.
 * In development environent,disabeld by default.
 */

function createInspector() {
  var option;

  try {
    option = process.env.NODE_ENV === 'production' ? getProdOption() : getDevOption();
  } catch (e) {
    option = getProdOption();
  }

  if (!option.enabled) {
    return null;
  } // 0 -> dispatch 1 -> response
  // [ [0, 1], [0, null], [0, 1] ]


  var couples = []; // to avoid making bad effect on program

  var life = 100;
  var suspects = new Array(life).fill(0);
  var timer;
  setTimeout(function () {
    return timer = setInterval(function () {
      return verifyTimes();
    }, option.interval);
  }, 500);

  function verifyTimes() {
    if (couples.length >= life) {
      clearInterval(timer);
      return;
    }

    couples.forEach(function (couple, index) {
      if (couple[0] === 0 && couple[1] !== 1) {
        suspects[index]++;
        return;
      }

      suspects[index] = 0;
    });

    if (suspects.some(function (suspect) {
      return suspect >= option.tolerance;
    }) && couples.length < life) {
      var text = "\n        You maybe forget to call 'notify' in 'process' function.\n        It's maybe make bad effect for your 'hook for dispatch',\n        or source is 'sequence', yet.\n      ";
      destroy();

      if (option.error) {
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

  function destroy() {
    couples.length = 100;
  }

  return {
    collect: collect,
    destroy: destroy
  };
}

var indexMap = [["before", 0], [0, 0], ["0", 0], ["after", 1], [1, 1], ["1", 1], ["interrupt", 2], ["2", 2], [2, 2]];

function transformIndex(key) {
  var couple = indexMap.filter(function (item) {
    return item[0] === key;
  }).map(function (item) {
    return item[1];
  });

  if (couple.length === 1) {
    return couple[0];
  }
}
/**
 * map:
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1].
  ["interrupt", 2]
  ["2", 2]
  [2, 2]
  Matchs value by tag
  if none, throw error.
 * @param {"before" | 0 | "0" | "after" | "1" | 1 | "interrupt" | "2" | 2 } tag as index
 * @returns {number} indexed value
 */


function validateTag(tag) {
  var index = transformIndex(tag);

  if (_typeof(index) === 'undefined') {
    throw new Error("\n      Invalid tag, expected:\n      \"before\", \"0\", 0, \"after\", \"1\", 1, \"interrupt\", \"2\", 2.\n      Instead, received: ".concat(tag, "\n    "));
  }

  return index;
}

function flat(hooks) {
  return hooks.reduce(function (a, b) {
    return a.concat(b);
  }, []);
}
/**
 * Creates a state machine when a action is dispatched.
 * Each action should own respective state machine,
 * so we can be able to observe status of each task.
 * @param {string} target user
 * @returns {StateMachine} 
 * hook, startWork and endWork, they are functions.
 * The startWork and endWork is used for marking state machine's status.
 * The hook let's do something before state machine works or after worked.
 */


function creatStateMachine(target) {
  var interactive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  // 0 -> before, 1 -> after 2 -> interrupt
  var hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  var name = target;
  var resetCounts = 0;

  function hook(tag, fn, pos) {
    var currentResetCounts = resetCounts;
    var index = validateTag(tag);

    if (_typeof(fn) !== 'function') {
      throw new Error("Expected the fn as a function. Instead, received: ".concat(_typeof(fn), "."));
    }

    var len = hooksMap[index][pos].length;
    hooksMap[index][pos][len] = fn;
    var released = false;
    return function () {
      if (!released && currentResetCounts === resetCounts && hooksMap[index][pos].length >= len) {
        released = true;
        hooksMap[index][pos][len] = null;
      }
    };
  }

  var uid = 1;

  function createWorkUnit() {
    var cuid = uid++;
    var processing;
    var interrupted = false;

    function startWork(action) {
      if (interrupted) {
        return;
      }

      if (processing) {
        throw new Error("SM named ".concat(name, " has started work!"));
      }

      filterNullValues(flat(hooksMap[0])).forEach(function (hook) {
        return hook(action);
      });
      processing = true;
    }

    function endWork(datasource, action) {
      if (interrupted) {
        return;
      }

      if (!processing) {
        throw new Error("SM named ".concat(name, " has ended work!"));
      }

      processing = false;
      filterNullValues(flat(hooksMap[1])).forEach(function (hook) {
        return hook(datasource, action);
      });
    }

    function interrupt() {
      if (interrupted && interactive) {
        console.log("No impact of this interruption, because state machine named ".concat(name, " has interrupted, the uid: ").concat(cuid, "."));
        return;
      }

      if (!processing && interactive) {
        if (_typeof(processing) === 'undefined') {
          console.log("No impact of this interruption, because state machine has not worked, the uid: ".concat(cuid, "."));
          return;
        }

        if (_typeof(processing) === 'boolean') {
          console.log("No impact of this interruption, because state machine has worked, the uid: ".concat(cuid, "."));
          return;
        }

        console.log("State Machine can be interrupted only after working or before ended, the uid: ".concat(cuid, "."));
        return;
      }

      interrupted = true;
      processing = false;
      filterNullValues(flat(hooksMap[2])).forEach(function (hook) {
        return hook(name);
      });

      if (interactive) {
        console.log("State Machine named ".concat(name, " is interrupted, the uid: ").concat(cuid, "."));
        console.log("---------------");
      }
    }

    return {
      startWork: startWork,
      endWork: endWork,
      interrupt: interrupt
    };
  }

  function reset() {
    resetCounts++;
    hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  }

  return {
    hook: hook,
    reset: reset,
    createWorkUnit: createWorkUnit
  };
}

/**
 * 每一个action都有自己对应的state machine,
 * state machine可以被监听，可被监听的时间点有4个: 开始工作前, 结束工作后, 打断工作后.
 * Observe api让我们对action进行监听，实际上我们监听的是对应的state machine.
 * 系统内部会监听它，同时，使用者可以对特定的action监听或任意的action监听.
 * 监听的回调函数是有顺序的，下面是顺序的描述对象
 * （对任意action监听的回调函数发生在特定action的之前）
 * ------------------------------------------------
 * Each action owns respective state machine.
 * The state machine can be observed, allowed times are: before working, after worked, after interrupted.
 * ('Observe api' let us to observe the actions, actually, the state machines are real target.)
 * We will observe actions inside the system to do something necessary, and user can observe any action or specific action.
 * Callbacks of observations are order, the follwing is order-object
 * (Observations of any action  are notified at first, then observations of specific action. )
 */

var HOOK_ORDER_MAP = {
  before: {
    system: 0,
    // any
    observer: 1,
    // specific
    user: 2
  },
  after: {
    observer: 0,
    user: 1,
    system: 2
  },
  interrupt: {
    observer: 0,
    user: 1,
    system: 2
  }
};
/**
 * @param {Processor} processor is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {Source} let's observe specific op of source and dispatch them.
 */

function createSource(processor, discrete) {
  if (_typeof(processor) !== 'function') {
    throw new Error("Expected the process as a function. Instead, received: ".concat(_typeof(processor)));
  }

  var inspector = createInspector();
  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false happened at time when processor stop working,
   * otherwise, after action dispatched.
   * If action is interrupted, right now, sets waiting false;
   */

  var waiting = false; // item: [type, state machine, dispatch, interrupt];

  var groups = [];

  function record(type, sm, dispatch) {
    groups.push([type, sm, dispatch]);
  }

  function findGroup(type) {
    return groups.find(function (group) {
      return group[0] === type;
    });
  }

  function interrupt(type) {
    var group = findGroup(type);

    if (group) {
      group[3]();
      return;
    }

    console.warn("Doesn't exist the type named ".concat(type, ". can't interrupt"));
  }

  function hasType(type) {
    return !!findGroup(type);
  }

  function getDispatch(type) {
    var group = findGroup(type);

    if (group) {
      return group[2];
    }
  }
  /**
   * 0 -> before action working.
   * 1 -> after action worked.
   * 2 -> after action interrupted.
   */


  var observers = [[], [], []];
  var unloaders = [[], [], []];
  var resetCounts = 0;
  /**
   * Observe dispatch.
   * @param {string} type  whom we observe
   * @param {Tag} tag observing time
   * @param {Function} fn what something we want to do, if the type is observed.
   */

  function observe(type, tag, fn) {
    // Function signature looks like observe(tag, fn).
    if (_typeof(tag) === 'function' && _typeof(type) !== 'undefined' && _typeof(fn) === 'undefined') {
      return observeAll(type, tag);
    }

    return observeOne(type, tag, fn);
  }

  function observeAll(tag, fn) {
    var currentResetCounts = resetCounts;
    var index = validateTag(tag);
    var len = observers[index].length;
    observers[index][len] = fn;
    unloaders[index][len] = {};
    var released = false;
    return function () {
      if (!released && currentResetCounts === resetCounts && unloaders[index].length >= len) {
        for (var _i = 0, _Object$entries = Object.entries(unloaders[index][len]); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
              unload = _Object$entries$_i[1];

          unload();
        }

        observers[index][len] = null;
      }
    };
  }

  function observeOne(type, tag, fn) {
    if (!hasType(type)) {
      console.warn("Cant't observe action before created, the action's type is ".concat(type, "."));
      return;
    }

    var index = validateTag(tag);
    var group = groups.find(function (group) {
      return group[0] === type;
    });
    var positon = 0;

    switch (index) {
      case 0:
        positon = HOOK_ORDER_MAP['before'].user;
        break;

      case 1:
        positon = HOOK_ORDER_MAP['after'].user;
        break;

      case 2:
        positon = HOOK_ORDER_MAP['interrupt'].user;
        break;
    }

    return group[1].hook(tag, function (arg1, arg2) {
      var isBefore = index === 0;
      var isAfter = index === 1;
      var isInterrupt = index == 2;

      if (isInterrupt && arg1 === type) {
        // fn(action.type)
        fn(type);
        return;
      }

      if (isBefore) {
        // fn(action);
        fn(arg1);
        return;
      }

      if (isAfter) {
        // fn(datasource, action)
        fn(arg1, arg2);
        return;
      }

      console.warn("Unknown index: ".concat(index, ", this means unknown hook."));
    }, positon);
  } // It's used to do index state machie by the type.
  // Inspector uses it to know who is processing, too.


  var uid = 0;
  /**
   * Creates a dispatch for task you want.
   * We need 'pre-create' the each dispatch with the 'type', then, just use these dispatches.
   * @param {string} type Describes what is the action.
   * @returns {Dispatch} Function A that dispatches action to your processor.
   * If the type specified as string, parameter called action always own 'type' key with the string
   */

  function createDispatch(type) {
    if (_typeof(type) !== 'string' || !type) {
      throw new Error("\n        Expected the type as a string and not empty.\n        Instead, type received:".concat(_typeof(type), ", value received:").concat(type, "\n      "));
    }

    var currentResetCounts = resetCounts;

    if (hasType(type)) {
      console.warn("The dispatch of type has existed: ".concat(type));
      return;
    } // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The system_hook is used for developer to control 'waiting' and something necessary.


    var sm = creatStateMachine(type);
    var currentWorkUnit; // createDispatch will return it.

    function dispatch(payload) {
      if (currentResetCounts !== resetCounts) {
        console.log("Invalid dispatch, because the source has reseted, the type is ".concat(type));
        return;
      }

      if (!discrete && waiting) {
        throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter\n          called 'discrete' of 'createSource'.\n          The current type is ".concat(type, ".\n        "));
      }

      if (currentWorkUnit && discrete) {
        currentWorkUnit.interrupt();
      }

      var workUnit = sm.createWorkUnit();
      currentWorkUnit = workUnit;
      var action = {
        type: type,
        payload: payload
      };
      var group = findGroup(type);

      if (group) {
        // current interrupt
        group[3] = workUnit.interrupt;
      }

      workUnit.startWork(action);
      processor(action, function (datasource) {
        return workUnit.endWork(datasource, action);
      });
    }

    var suid = uid++; // Bind hooks:
    // Hooks for 'before':
    // system

    sm.hook("before", function () {
      waiting = true;

      if (inspector) {
        inspector.collect(suid, 0);
      }

      if (discrete) {
        waiting = false;
      }
    }, HOOK_ORDER_MAP["before"].system); // observers' hooks

    filterNullValues(observers[0]).forEach(function (fn, i) {
      return unloaders[0][i][type] = sm.hook("before", fn, HOOK_ORDER_MAP["before"].observer);
    }); // Binds Hooks for 'after'
    // system hook

    sm.hook('after', function () {
      if (inspector) {
        inspector.collect(suid, 1);
      }

      if (!discrete) {
        waiting = false;
      }
    }, HOOK_ORDER_MAP["before"].system); // observers' hooks

    filterNullValues(observers[1]).forEach(function (fn, i) {
      return unloaders[1][i][type] = sm.hook("after", fn, HOOK_ORDER_MAP["after"].observer);
    }); // Bind Hooks for 'interrupt'

    sm.hook("interrupt", function () {
      // inspector is able to collect 'start' of action, opposite, is not.
      if (inspector) {
        inspector.collect(suid, 1);
      }

      waiting = false;
    }, HOOK_ORDER_MAP["interrupt"].system); // observers' hooks

    filterNullValues(observers[2]).forEach(function (fn, i) {
      return unloaders[2][i][type] = sm.hook("interrupt", fn, HOOK_ORDER_MAP["interrupt"].observer);
    });
    record(type, sm, dispatch);
    return dispatch;
  }
  /**
   * Creates some dispatches.
   * @param {Array<string>} types 
   */


  function createDispatches() {
    for (var _len = arguments.length, types = new Array(_len), _key = 0; _key < _len; _key++) {
      types[_key] = arguments[_key];
    }

    return types.map(function (type) {
      return createDispatch(type);
    });
  }

  function isDiscrete() {
    return !!discrete;
  }

  function isWaiting() {
    return waiting;
  }
  /**
   * @param {Action} action 
   */


  function dispatch(action) {
    var dispatch;

    if (hasType(action.type)) {
      dispatch = getDispatch(action.type);
    } else {
      dispatch = createDispatch(action.type);
    }

    dispatch(action.payload);
    return dispatch;
  }

  function reset() {
    groups.forEach(function (group) {
      // interrupts all available action.
      if (_typeof(group[3]) === 'function') {
        group[3]();
      }

      group[1].reset();
    });
    groups = [];

    if (inspector) {
      inspector.destroy();
    }

    inspector = createInspector();
    observers = [[], [], []];
    unloaders = [[], [], []];
    waiting = false;
    resetCounts++;
  }

  return {
    observe: observe,
    isDiscrete: isDiscrete,
    isWaiting: isWaiting,
    reset: reset,
    hasType: hasType,
    dispatch: dispatch,
    interrupt: interrupt,
    createDispatch: createDispatch,
    createDispatches: createDispatches
  };
}

export { createSource };
