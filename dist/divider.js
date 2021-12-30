(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.divider = {}));
})(this, (function (exports) { 'use strict';

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
      })) {
        var text = "\n        You maybe forget to call 'notify' in 'process' function.\n        It's maybe make bad effect for your 'hook for dispatch',\n        or source is 'sequence', yet.\n      ";
        couples.length = life;

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

    return {
      collect: collect
    };
  }

  var indexMap = [["before", 0], [0, 0], ["0", 0], ["after", 1], [1, 1], ["1", 1], ["create", 2], ["2", 2], [2, 2]];

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
    ["create", 2]
    ["2", 2]
    [2, 2]
    Matchs value by tag
    if none, throw error.
   * @param {"before" | 0 | "0" | "after" | "1" | 1 | "create" | "2" | 2} tag as index
   * @returns {number} indexed value
   */


  function validateTag(tag) {
    var index = transformIndex(tag);

    if (_typeof(index) === 'undefined') {
      throw new Error("\n      Invalid tag.Expected: \"before\", \"0\", 0, \"after\", \"1\", 1, \"create\", \"2\", 2. Instead, received: ".concat(tag, "\n    "));
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
   * @param {number} number
   * We can add hook into pos 0 or pos 1, hooks of pos 0 always called before hooks of pos 1.
   * So wen can ensure priority of each hook.
   * If the number is 2, the number of kind of hook priority is 2.
   * @returns {StateMachine} 
   * hook, startWork and endWork, they are functions.
   * The startWork and endWork is used for marking state machine's status.
   * The hook let's do something before state machine works or after worked.
   */


  function creatStateMachine(target, number, effect) {
    // 0 -> before, 1 -> after 2 -> create
    var hooks = [[], [], []];
    var name = target;
    var processing = false;

    for (var i = 1; i <= number; i++) {
      hooks[0].push([]);
      hooks[1].push([]);
      hooks[2].push([]);
    }

    function hook(tag, fn, pos) {
      var index = validateTag(tag);

      if (_typeof(fn) !== 'function') {
        throw new Error("\n        Expected the fn as a function. Instead, received: ".concat(_typeof(fn), ".\n      "));
      }

      hooks[index][pos].push(fn);
    }

    function startWork(action) {
      if (processing) {
        throw new Error("SM named ".concat(name, " has started work!"));
      }

      processing = true;
      flat(hooks[0]).forEach(function (hook) {
        return hook(action);
      });
    }

    function endWork(datasource, action) {
      if (!processing) {
        throw new Error("SM named ".concat(name, " has ended work!"));
      }

      processing = false;
      flat(hooks[1]).forEach(function (hook) {
        return hook(datasource, action);
      });
    }

    var sm = {
      hook: hook,
      startWork: startWork,
      endWork: endWork
    };
    effect(sm);
    flat(hooks[2]).forEach(function (hook) {
      return hook(name);
    });
    return sm;
  }

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
     */

    var waiting = false; // Type of action maps its state machine

    var typeMapSM = [];

    function hasType(type) {
      return !!typeMapSM.find(function (map) {
        return map[0] === type;
      });
    } // starting and ending of any dispatch can be observed, or creating dispatch.
    // observers[0] -> starting
    // observers[1] -> ending
    // observers[2] -> creating


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
        observeAll(type, tag);
        return;
      }

      return observeOne(type, tag, fn);
    }

    function observeAll(tag, fn) {
      var index = validateTag(tag);
      observers[index].push(fn);
    }

    var delays = [];

    function observeOne(type, tag, fn) {
      if (!hasType(type)) {
        delays.push({
          type: type,
          tag: tag,
          fn: fn
        });
        return type;
      }

      var index = validateTag(tag);
      var couple = typeMapSM.find(function (couple) {
        return couple[0] === type;
      });
      var isBefore = index === 0;
      var isCreate = index === 2;
      couple[1].hook(tag, function (arg1, arg2) {
        if (isCreate && arg1 === type) {
          // fn(type);
          fn(type);
          return;
        }

        if (isBefore) {
          arg2 = arg1;
        }

        if (arg2.type === type) {
          if (isBefore) {
            // fn(action);
            fn(arg2);
          } else {
            // fn(dataSource, action)
            fn(arg1, arg2);
          }
        }
      }, isCreate ? 1 : isBefore ? 2 : 1);
      return type;
    }

    function tryRunDelay(type) {
      if (!hasType(type)) {
        return;
      }

      var index = delays.findIndex(function (delay) {
        return delay.type === type;
      });

      if (index < 0) {
        return;
      }

      var _delays$splice$ = delays.splice(index, 1)[0],
          tag = _delays$splice$.tag,
          fn = _delays$splice$.fn;
      observeOne(type, tag, fn);
      tryRunDelay(type);
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
        throw new Error("\n        Expected the type as a string and not empty.\n        Instead, type received".concat(_typeof(type), ", value received:").concat(type, "\n      "));
      }

      if (typeMapSM.find(function (map) {
        return map[0] === type;
      })) {
        throw new Error("The type has existed: ".concat(type));
      } // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
      // The observe_hook's action like middleware, because it can observe any dispatch of one source.
      // The observer_hook is called always before custom_hook.
      // The system_hook is used for developer to control 'waiting' and something necessary.


      var sm = creatStateMachine(type, 3, function (sm) {
        observers[2].forEach(function (fn) {
          return sm.hook("create", fn, 0);
        });
        typeMapSM.push([type, sm]);
        tryRunDelay(type);
      });
      var suid = uid++; // system hook

      sm.hook('after', function () {
        if (inspector) {
          inspector.collect(suid, 1);
        }

        if (!discrete) {
          waiting = false;
        }
      }, 2); // observers hook

      observers[1].forEach(function (fn) {
        return sm.hook("after", fn, 0);
      });

      var createNotify = function createNotify(action) {
        return function (datasource) {
          return sm.endWork(datasource, action);
        };
      }; // system hook


      sm.hook("before", function () {
        waiting = true;

        if (inspector) {
          inspector.collect(suid, 0);
        }

        if (discrete) {
          waiting = false;
        }
      }, 0); // observers hook

      observers[0].forEach(function (fn) {
        return sm.hook("before", fn, 1);
      });

      function dispatch(payload) {
        if (!discrete && waiting) {
          throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter\n          called 'discrete' of 'createSource'.\n          The current type is ".concat(type, ".\n        "));
        }

        var action = {
          type: type,
          payload: payload
        };
        sm.startWork(action);
        processor(action, createNotify(action));
      }

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

    return {
      observe: observe,
      isDiscrete: isDiscrete,
      isWaiting: isWaiting,
      hasType: hasType,
      createDispatch: createDispatch,
      createDispatches: createDispatches
    };
  }

  exports.createSource = createSource;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
