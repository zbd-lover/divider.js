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
  // 0 -> before, 1 -> after 2 -> interrupt
  var hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  var name = target;
  var processing = false;
  var interrupted = false;

  function hook(tag, fn, pos) {
    var index = validateTag(tag);

    if (_typeof(fn) !== 'function') {
      throw new Error("\n        Expected the fn as a function. Instead, received: ".concat(_typeof(fn), ".\n      "));
    }

    var len = hooksMap[index][pos].length;
    hooksMap[index][pos].push(fn);
    var released = false;
    return function () {
      if (!released && hooksMap[index][pos].length >= len) {
        released = true;

        hooksMap[index][pos][len] = function () {};
      }
    };
  } // reset status


  function tryWork() {
    if (interrupted) {
      interrupted = false;
      processing = false;
      return false;
    }

    return true;
  }

  function startWork(action) {
    // reset status 
    if (interrupted) {
      return;
    }

    if (processing) {
      throw new Error("SM named ".concat(name, " has started work!"));
    }

    flat(hooksMap[0]).forEach(function (hook) {
      return hook(action);
    });
    processing = true;
  }

  function endWork(datasource, action) {
    // not only resets status, and also skips the 'endwork'.
    if (!tryWork()) return;

    if (!processing) {
      throw new Error("SM named ".concat(name, " has ended work!"));
    }

    processing = false;
    flat(hooksMap[1]).forEach(function (hook) {
      return hook(datasource, action);
    });
  }

  function interrupt() {
    if (!processing) {
      console.warn("State Machine can be interrupted only after working or before ended.");
      return;
    }

    interrupted = true;
    flat(hooksMap[2]).forEach(function (hook) {
      return hook(name);
    });
  }

  function reset() {
    processing = false;
    interrupted = false;
    hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  }

  return {
    hook: hook,
    reset: reset,
    interrupt: interrupt,
    startWork: startWork,
    endWork: endWork
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

  var waiting = false; // item: [type, state machine, dispatch];

  var groups = [];

  function record(type, sm, dispatch) {
    groups.push([type, sm, dispatch]);
  }

  function findGroup(type) {
    return groups.find(function (group) {
      return group[0] === type;
    });
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
    var index = validateTag(tag);
    observers[index].push(fn);
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

    if (hasType(type)) {
      console.warn("The dispatch of type has existed: ".concat(type));
      return;
    } // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The system_hook is used for developer to control 'waiting' and something necessary.


    var sm = creatStateMachine(type); // createDispatch will return it.

    function dispatch(payload) {
      if (!discrete && waiting) {
        throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter\n          called 'discrete' of 'createSource'.\n          The current type is ".concat(type, ".\n        "));
      }

      var action = {
        type: type,
        payload: payload
      };
      sm.startWork(action);
      processor(action, function (datasource) {
        return sm.endWork(datasource, action);
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

    observers[0].forEach(function (fn) {
      return sm.hook("before", fn, HOOK_ORDER_MAP["before"].observer);
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

    observers[1].forEach(function (fn) {
      return sm.hook("after", fn, HOOK_ORDER_MAP["after"].observer);
    }); // Bind Hooks for 'interrupt'

    sm.hook("interrupt", function (name) {
      console.log("Action named '".concat(name, "' is interrupted before worked completely.")); // inspector is able to collect 'start' of action, opposite, is not.

      if (inspector) {
        inspector.collect(suid, 1);
      }

      waiting = false;
    }, HOOK_ORDER_MAP["interrupt"].system); // observers' hooks

    observers[2].forEach(function (fn) {
      return sm.hook("interrupt", fn, HOOK_ORDER_MAP["interrupt"].observer);
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

  function interrupt(type) {
    var group = findGroup(type);

    if (group) {
      group[1].interrupt();
      return;
    }

    console.warn("Doesn't exist the type named ".concat(type, ". can't interrupt"));
  }

  function reset() {
    groups.forEach(function (group) {
      return group[1].reset();
    });
    groups = [];

    if (inspector) {
      inspector.destroy();
    }

    inspector = createInspector();
    observers = [[], [], []];
    waiting = false;
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
