var divider = (function (exports) {
  'use strict';

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

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

  var _toString = Object.prototype.toString; // Type of a value.

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
   * @param {Array<T>} arr 
   * @returns Array<T>
   */

  function filterNullValues(arr) {
    if (_typeof(arr) !== 'array') {
      return [];
    }

    return arr.filter(function (item) {
      return !!item;
    });
  }

  var hasOwn = Object.prototype.hasOwnProperty;
  /**
   * Whether a object own all specified properties at least.
   * @param {object} obj 
   * @param {Array<String>} keys 
   */

  function verifyShape(obj, keys, host) {
    if (_typeof(obj) === 'object') {
      if (keys.some(function (key) {
        return !hasOwn.call(obj, key);
      })) {
        throw new Error("Expected the ".concat(host || 'obj', " must own keys: ").concat(keys.join(' ')));
      }

      return;
    }

    console.warn("Expected the object as object. Instead, received: ".concat(_typeof(obj)));
  }

  var indexMap = [["start", 0], [0, 0], ["0", 0], ["end", 1], [1, 1], ["1", 1], ["interrupt", 2], ["2", 2], [2, 2]];

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
   * Matchs value by tag if none, throw error.
   * @param {"start" | 0 | "0" | "end" | "1" | 1 | "interrupt" | "2" | 2 } tag as index
   * @returns {number} indexed value
   */


  function validateTag(tag) {
    var index = transformIndex(tag);

    if (_typeof(index) === 'undefined') {
      throw new Error("\n      Invalid tag, expected:\n      \"start\", \"0\", 0, \"end\", \"1\", 1, \"interrupt\", \"2\", 2.\n      Instead, received: ".concat(tag, "\n    "));
    }

    return index;
  }

  function _flat(hooks) {
    return hooks.reduce(function (a, b) {
      return a.concat(b);
    }, []);
  }
  /**
   * Creates a state machine when `createDispatch` is called.
   * Each 'dispatch' should own respective state machine,
   * so we can be able to observe status of each task.
   * @param {string} target user
   * @param {Function} log prints tips of statemachine workflows.
   * @returns {StateMachine} 
   * `hook`, `reset`, `createWorkUnit`, they are functions.
   * `hook` let's do something before state machine works or after worked.
   * `createWork` unit returns `startWork`, `endWork`, and `interrupt`,
   * `startWork` and `endWork` is used for marking machine's status,
   * `interrupt`: Will not notify observers in this processing.
   */


  function creatStateMachine(target) {
    var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : console.log;
    // 0 -> start, 1 -> end 2 -> interrupt
    var hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
    var name = target;
    var currentInterrupt;

    function hook(tag, fn, pos) {
      var index = validateTag(tag);

      if (_typeof(fn) !== 'function') {
        throw new Error("Expected the fn as a function. Instead, received: ".concat(_typeof(fn), "."));
      }

      var len = hooksMap[index][pos].length;
      hooksMap[index][pos][len] = fn;
      var released = false;
      return function () {
        if (!released && hooksMap[index][pos].length >= len) {
          released = true;
          hooksMap[index][pos][len] = null;
        }
      };
    }

    var uid = 1;

    function createWorkUnit() {
      var wuid = uid++;
      var processing;
      var interrupted = false;

      function startWork(action) {
        if (interrupted) {
          return;
        }

        if (processing) {
          throw new Error("SM named ".concat(name, " has started work!"));
        }

        filterNullValues(_flat(hooksMap[0])).forEach(function (hook) {
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
        filterNullValues(_flat(hooksMap[1])).forEach(function (hook) {
          return hook(datasource, action);
        });
      }

      function interrupt() {
        if (interrupted) {
          log("No impact of this interruption, because state machine has interrupted, name is ".concat(name, ", uid is ").concat(wuid, "."));
          log("Current task's uid is ".concat(wuid + 1));
          return;
        }

        if (!processing) {
          if (_typeof(processing) === 'undefined') {
            log("No impact of this interruption, because state machine has not worked, name is ".concat(name, ", uid is ").concat(wuid, "."));
            log("Current task's uid is ".concat(wuid + 1));
            return;
          }

          if (_typeof(processing) === 'boolean') {
            log("No impact of this interruption, because state machine has worked, name is ".concat(name, ", uid is ").concat(wuid, "."));
            log("Current task's uid is ".concat(wuid + 1));
            return;
          }

          log("State Machine can be interrupted only after working or before ended, name is ".concat(name, ", uid is ").concat(wuid, "."));
          log("Current task's uid is ".concat(wuid + 1));
          return;
        }

        interrupted = true;
        processing = false;
        filterNullValues(_flat(hooksMap[2])).forEach(function (hook) {
          return hook(name);
        });
        log("State Machine named ".concat(name, " is interrupted, the uid: ").concat(wuid, "."));
        log("Current task's uid is ".concat(wuid + 1));
        log("---------------");
      }

      currentInterrupt = interrupt;
      return {
        startWork: startWork,
        endWork: endWork,
        interrupt: interrupt
      };
    }

    return {
      hook: hook,
      createWorkUnit: createWorkUnit,
      interrupt: function interrupt() {
        if (_typeof(currentInterrupt) === 'function') {
          currentInterrupt();
        }
      }
    };
  }

  /**
   * Logs text conditionally
   * @param {Boolean} condition 
   * @returns Function
   */
  function createLog(condition) {
    if (condition) {
      return function (text) {
        return text;
      };
    }

    return function (text) {
      return console.log(text);
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
   * We will observe actions inside the system to do something necessary,
   * and user can observe any action or specific action.
   * Callbacks of observations are order, the follwing is order-object
   * (Observations of any action  are notified at first, then observations of specific action. )
   */

  var HOOK_ORDER_MAP = {
    start: {
      system: 0,
      // any
      observer: 1,
      // specific
      user: 2
    },
    end: {
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
  var DEFAULT_OPTION = {
    tip: {
      statemachine: false
    }
  };
  /**
   * @param {Processor} processor is consist of all relative operations of data.
   * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
   * @param {Option} option extra config
   * @returns {Source} let's observe specific op of source and dispatch them.
   */

  function createSource(processor, discrete) {
    var option = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTION;

    if (_typeof(processor) !== 'function') {
      throw new Error("Expected the process as a function. Instead, received: ".concat(_typeof(processor)));
    }
    /**
     * Can we dispatch the next action right now?
     * Sets waiting true when processor starts working.
     * If source is discrete, set it false happened at time when processor stop working,
     * otherwise, after action dispatched.
     * If action is interrupted, right now, sets waiting false;
     */


    var waiting = false;
    /** group-item: [ type, statemachine, dispatch, interrupt ]; */

    var groups = [];
    /** save a group-item ( [ type, statemachine, dispatch, interrupt ] ) */

    var record = function record(type, sm, dispatch) {
      return groups.push([type, sm, dispatch]);
    };

    var findGroup = function findGroup(type) {
      return groups.find(function (group) {
        return group[0] === type;
      });
    };

    var getDispatch = function getDispatch(type) {
      return !!findGroup(type) ? findGroup(type)[2] : null;
    };

    function interrupt(type) {
      var group = findGroup(type);

      if (group) {
        group[1].interrupt();
        return;
      }

      console.warn("Doesn't exist the type named ".concat(type, ". can't interrupt"));
    }

    var util = {
      isDiscrete: function isDiscrete() {
        return !!discrete;
      },
      isWaiting: function isWaiting() {
        return waiting;
      },
      hasType: function hasType(type) {
        return !!findGroup(type);
      }
    };
    /**
     * 0 -> before action working.
     * 1 -> after action worked.
     * 2 -> after action interrupted.
     */

    var observers = [[], [], []];
    var unloaders = [[], [], []];
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
      var len = observers[index].length;
      observers[index][len] = fn;
      unloaders[index][len] = {};
      var released = false;
      return function () {
        if (!released && unloaders[index].length >= len) {
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
      if (!util.hasType(type)) {
        console.warn("Cant't observe action before created, the action's type is ".concat(type, "."));
        return;
      }

      var index = validateTag(tag);
      var group = findGroup(type);
      var positon = 0;

      switch (index) {
        case 0:
          positon = HOOK_ORDER_MAP['start'].user;
          break;

        case 1:
          positon = HOOK_ORDER_MAP['end'].user;
          break;

        case 2:
          positon = HOOK_ORDER_MAP['interrupt'].user;
          break;
      }

      return group[1].hook(tag, // this function looks like 'reloadsing of function'.
      function (arg1, arg2) {
        var isStart = index === 0;
        var isEnd = index === 1;
        var isInterrupt = index == 2;

        if (isInterrupt && arg1 === type) {
          // fn(action.type)
          fn(type);
          return;
        }

        if (isStart) {
          // fn(action);
          fn(arg1);
          return;
        }

        if (isEnd) {
          // fn(datasource, action)
          fn(arg1, arg2);
          return;
        }

        console.warn("Unknown index: ".concat(index, ", this means unknown hook."));
      }, positon);
    }

    var logOfStateMachine = createLog(option.tip.statemachine);
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

      if (util.hasType(type)) {
        console.warn("The dispatch of type has existed: ".concat(type));
        return;
      } // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
      // The observe_hook's action like middleware, because it can observe any dispatch of one source.
      // The system_hook is used for developer to control 'waiting' and something necessary.


      var sm = creatStateMachine(type, logOfStateMachine); // Each calling of dispatch owns individual status.
      // When action with type 'A' is dispatched, the previous action with type 'A' need to be interrupted.

      var lastWorkUnit;

      function dispatch(payload) {
        if (!util.isDiscrete() && waiting) {
          throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter called 'discrete' of 'createSource'.\n          The current type is ".concat(type, ".\n        "));
        }

        if (lastWorkUnit && util.isDiscrete()) {
          lastWorkUnit.interrupt();
        }

        var workUnit = sm.createWorkUnit();
        lastWorkUnit = workUnit;
        var action = {
          type: type,
          payload: payload
        };
        workUnit.startWork(action);
        processor(action, function (datasource) {
          return workUnit.endWork(datasource, action);
        });
      } // Bind hooks:
      // Hooks for 'start':
      // system


      sm.hook("start", function () {
        waiting = true;

        if (discrete) {
          waiting = false;
        }
      }, HOOK_ORDER_MAP["start"].system); // observers' hooks

      filterNullValues(observers[0]).forEach(function (fn, i) {
        return unloaders[0][i][type] = sm.hook("start", fn, HOOK_ORDER_MAP["start"].observer);
      }); // Binds Hooks for 'end'
      // system hook

      sm.hook('end', function () {
        if (!discrete) {
          waiting = false;
        }
      }, HOOK_ORDER_MAP["end"].system); // observers' hooks

      filterNullValues(observers[1]).forEach(function (fn, i) {
        return unloaders[1][i][type] = sm.hook("end", fn, HOOK_ORDER_MAP["end"].observer);
      }); // Bind Hooks for 'interrupt'

      sm.hook("interrupt", function () {
        return waiting = false;
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
    /**
     * Grammar sugar
     * @param {Action} action 
     */


    function dispatch(action) {
      verifyShape(action, ['type'], 'The action');
      var dispatch;

      if (util.hasType(action.type)) {
        dispatch = getDispatch(action.type);
      } else {
        dispatch = createDispatch(action.type);
      }

      dispatch(action.payload);
      return dispatch;
    }

    function replaceDispatch(type, dispatch) {
      var index = groups.findIndex(function (group) {
        return group[0] === type;
      });

      if (index < 0) {
        console.warn("Replacement failed, doesn't exist the type: ".concat(type, "."));
        return;
      }

      if (_typeof(dispatch) !== 'function') {
        throw new Error("Expected the dispatch as function. Instead, received: ".concat(_typeof(dispatch)));
      }

      groups[index][2] = dispatch;
    }

    return _objectSpread2(_objectSpread2({}, util), {}, {
      observe: observe,
      interrupt: interrupt,
      createDispatch: createDispatch,
      replaceDispatch: replaceDispatch,
      createDispatches: createDispatches,
      dispatch: dispatch,
      reset: function reset() {
        return console.log("No effect, the 'reset' api has deprecated.");
      }
    });
  }

  /**
   * @param {Source} source target
   * @param  {...MiddleWare[]} middlewares 
   * @returns {Source}
   * Note: 
   * Constructing of each middleware is from right to left, but decorating code of `createDispatch` runs from left to right.
   * This means that first middleware is constructed end, 
   * but its decorating code for the createDispatch is called at first,
   * when final createDispatch (after applied middlewares) is called.
   */

  function applyMiddleware(source) {
    for (var _len = arguments.length, middlewares = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      middlewares[_key - 1] = arguments[_key];
    }

    var currentMiddlewares = middlewares.filter(function (middleware) {
      return _typeof(middleware) === 'function';
    });

    if (middlewares.length > currentMiddlewares.length) {
      console.warn("Each middleware must be a function, the number of non functions is ".concat(middlewares.length - currentMiddlewares.length));
    }

    if (currentMiddlewares.length === 0) {
      return source;
    }

    var hasConstructed = false;
    var dispatchRefs = {
      invalid: {},
      valid: {}
    };

    var initialCreateDispatch = function initialCreateDispatch(type) {
      var dispatch = source.createDispatch(type);

      dispatchRefs.invalid[type] = function () {
        throw new Error("Can't called dispatch when middleware is constructing");
      };

      dispatchRefs.valid[type] = dispatch;
      return function (payload) {
        return dispatchRefs["".concat(hasConstructed ? 'valid' : 'invalid')][type](payload);
      };
    };

    var _PURE_createDispatch = initialCreateDispatch;

    var _PURE_createDispatches = function _PURE_createDispatches() {
      for (var _len2 = arguments.length, types = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        types[_key2] = arguments[_key2];
      }

      return types.map(function (type) {
        return _PURE_createDispatch(type);
      });
    };

    var util = {
      isWaiting: function isWaiting() {
        return source.isWaiting();
      },
      hasType: function hasType(type) {
        return source.hasType(type);
      },
      isDiscrete: function isDiscrete() {
        return source.isDiscrete();
      },
      // We usually use it.
      observe: function observe(type, tag, fn) {
        return source.observe(type, tag, fn);
      }
    };

    var middlewareAPI = _objectSpread2({
      // We usually will decorate it.
      createDispatch: initialCreateDispatch,
      // If we need create a dispatch that isn't affected by 'createDispatch'
      // that has been decorated by other middlewares, just use it.
      _PURE_createDispatch: _PURE_createDispatch,
      _PURE_createDispatches: _PURE_createDispatches
    }, util);

    var createDispatches = null;
    currentMiddlewares.unshift(function (_ref) {
      var createDispatch = _ref.createDispatch;
      return function (type) {
        // 1. Middleware maybe decorate `dispatch`, result of `createDispatch`.
        // 2. Corrects `dispatch api` of source.
        var dispatch = createDispatch(type);

        if (source.hasType(type)) {
          source.replaceDispatch(type, dispatch);
        }

        return dispatch;
      };
    });
    var createDispatch = currentMiddlewares.reverse().reduce(function (latestCreateDispatch, middleware, index) {
      if (_typeof(latestCreateDispatch) !== 'function') {
        throw new Error("\n          The middleware ".concat(currentMiddlewares.length - index, " is invalid,\n          middleware must return a function that decorates 'createDispatch' by it.\n        "));
      }

      var latestCreateDispatches = function latestCreateDispatches() {
        for (var _len3 = arguments.length, types = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          types[_key3] = arguments[_key3];
        }

        return types.map(function (type) {
          return latestCreateDispatch(type);
        });
      };

      var nextLatestCreateDispatch = middleware(_objectSpread2(_objectSpread2({}, middlewareAPI), {}, {
        createDispatch: latestCreateDispatch,
        createDispatches: latestCreateDispatches
      }));
      createDispatches = latestCreateDispatches;
      return nextLatestCreateDispatch;
    }, initialCreateDispatch);
    hasConstructed = true;
    return _objectSpread2(_objectSpread2({}, source), {}, {
      createDispatch: createDispatch,
      createDispatches: createDispatches
    });
  }

  /**
   * Validate the processor whether return false when accepted 'invalid' action
   * @param {Processor} processor
   * @param {string} name as tip
   * @returns boolean
   */

  function probe(processor, name) {
    if (_typeof(processor) !== 'function') {
      throw new Error("Expected the processor as function. Instead, received: ".concat(_typeof(processor), "."));
    }

    var action = {
      type: "@dividerjs/built_in_action".concat(Math.random())
    };

    if (processor(action) !== false) {
      console.warn("If the processor hasn't matched action, must return false.");

      if (name) {
        console.log("The processor's name is ".concat(name, "."));
      }

      return false;
    }

    return true;
  }

  function combineProcessors() {
    for (var _len = arguments.length, processors = new Array(_len), _key = 0; _key < _len; _key++) {
      processors[_key] = arguments[_key];
    }

    var currentProcessors = processors.filter(function (processor, index) {
      return probe(processor, "processor".concat(index + 1));
    });

    if (processors.length !== currentProcessors.length) {
      console.warn("\n      Processors must be a array of function, the number of non function is ".concat(processors.length - currentProcessors.length, "."));
    }

    if (currentProcessors.length === 0) {
      console.warn("The final processor is 'emtpy', the number of current processors is empty.");
      console.warn("The final function:");
      console.warn("\n      function emptyP(action, notify) {\n        notify(action, action);\n        return true;\n      }\n    ");
      return function emptyP(action, notify) {
        notify(action, action);
        return true;
      };
    }

    return function finalProcessor(action, notify) {
      for (var i = 0; i < currentProcessors.length; i++) {
        // The action has been processed.
        if (currentProcessors[i](action, notify)) {
          break;
        }
      }
    };
  }

  /**
   * Defines what types can be accepted by the processor, in advance.
   * @param {Processor} processor the processor
   * @param {Array<string>} types Expected types.
   * @returns {Processor} A decorated processor returns true or false
   * by 'action.type' automatically to express that the action will be processed or not.
   */

  function decorateProcessor(processor, types) {
    if (_typeof(processor) !== 'function') {
      throw new Error("Expected the processor as function. Instead, received:".concat(_typeof(processor), "."));
    }

    if (_typeof(types) !== 'array') {
      throw new Error("Expected the processor as array. Instead, received:".concat(_typeof(processor), "."));
    }

    var _types = filterNullValues(types);

    return function processorDecorated(action, notify) {
      if (!_types.includes(action === null || action === void 0 ? void 0 : action.type)) {
        return false;
      }

      processor(action, notify);
      return true;
    };
  }

  exports.applyMiddleware = applyMiddleware;
  exports.combineProcessors = combineProcessors;
  exports.createSource = createSource;
  exports.decorateProcessor = decorateProcessor;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
