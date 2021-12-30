var divider = (function (exports) {
  'use strict';

  const _toString = Object.prototype.toString;
  function _typeof(v) {
    if (typeof v === 'undefined' || v === null) {
      return 'undefined';
    }

    const type = _toString.call(v).slice(8, -1).toLowerCase();

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

  let forkOption = {
    enabled: [true, false],
    error: [true, false],
    interval: [1000, 1000],
    tolerance: [3, 3]
  };

  function extractOption(index) {
    const option = {};

    for (let key in forkOption) {
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
    let option;

    try {
      option = process.env.NODE_ENV === 'production' ? getProdOption() : getDevOption();
    } catch (e) {
      option = getProdOption();
    }

    if (!option.enabled) {
      return null;
    } // 0 -> dispatch 1 -> response
    // [ [0, 1], [0, null], [0, 1] ]


    const couples = []; // to avoid making bad effect on program

    const life = 100;
    const suspects = new Array(life).fill(0);
    let timer;
    setTimeout(() => timer = setInterval(() => verifyTimes(), option.interval), 500);

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

      if (suspects.some(suspect => suspect >= option.tolerance)) {
        const text = "\n        You maybe forget to call 'notify' in 'process' function.\n        It's maybe make bad effect for your 'hook for dispatch',\n        or source is 'sequence', yet.\n      ";
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
      collect
    };
  }

  const indexMap = [["before", 0], [0, 0], ["0", 0], ["after", 1], [1, 1], ["1", 1], ["create", 2], ["2", 2], [2, 2]];

  function transformIndex(key) {
    const couple = indexMap.filter(item => item[0] === key).map(item => item[1]);

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
    let index = transformIndex(tag);

    if (_typeof(index) === 'undefined') {
      throw new Error("\n      Invalid tag.Expected: \"before\", \"0\", 0, \"after\", \"1\", 1, \"create\", \"2\", 2. Instead, received: ".concat(tag, "\n    "));
    }

    return index;
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
    const hooks = [[], [], []];
    let name = target;
    let processing = false;

    for (let i = 1; i <= number; i++) {
      hooks[0].push([]);
      hooks[1].push([]);
      hooks[2].push([]);
    }

    function hook(tag, fn, pos) {
      const index = validateTag(tag);

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
      hooks[0].flat().forEach(hook => hook(action));
    }

    function endWork(datasource, action) {
      if (!processing) {
        throw new Error("SM named ".concat(name, " has ended work!"));
      }

      processing = false;
      hooks[1].flat().forEach(hook => hook(datasource, action));
    }

    const sm = {
      hook,
      startWork,
      endWork
    };
    effect(sm);
    hooks[2].flat().forEach(hook => hook(name));
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

    const inspector = createInspector();
    /**
     * Can we dispatch the next action right now?
     * Sets waiting true when processor starts working.
     * If source is discrete, set it false happened at time when processor stop working,
     * otherwise, after action dispatched.
     */

    let waiting = false; // Type of action maps its state machine

    const typeMapSM = [];

    function hasType(type) {
      return !!typeMapSM.find(map => map[0] === type);
    } // starting and ending of any dispatch can be observed, or creating dispatch.
    // observers[0] -> starting
    // observers[1] -> ending
    // observers[2] -> creating


    const observers = [[], [], []];
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
      let index = validateTag(tag);
      observers[index].push(fn);
    }

    const delays = [];

    function observeOne(type, tag, fn) {
      if (!hasType(type)) {
        delays.push({
          type,
          tag,
          fn
        });
        return type;
      }

      const index = validateTag(tag);
      const couple = typeMapSM.find(couple => couple[0] === type);
      const isBefore = index === 0;
      const isCreate = index === 2;
      couple[1].hook(tag, (arg1, arg2) => {
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

      let index = delays.findIndex(delay => delay.type === type);

      if (index < 0) {
        return;
      }

      let {
        tag,
        fn
      } = delays.splice(index, 1)[0];
      observeOne(type, tag, fn);
      tryRunDelay(type);
    } // It's used to do index state machie by the type.
    // Inspector uses it to know who is processing, too.


    let uid = 0;
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

      if (typeMapSM.find(map => map[0] === type)) {
        throw new Error("The type has existed: ".concat(type));
      } // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
      // The observe_hook's action like middleware, because it can observe any dispatch of one source.
      // The observer_hook is called always before custom_hook.
      // The system_hook is used for developer to control 'waiting' and something necessary.


      const sm = creatStateMachine(type, 3, sm => {
        observers[2].forEach(fn => sm.hook("create", fn, 0));
        typeMapSM.push([type, sm]);
        tryRunDelay(type);
      });
      const suid = uid++; // system hook

      sm.hook('after', () => {
        if (inspector) {
          inspector.collect(suid, 1);
        }

        if (!discrete) {
          waiting = false;
        }
      }, 2); // observers hook

      observers[1].forEach(fn => sm.hook("after", fn, 0));

      const createNotify = action => datasource => sm.endWork(datasource, action); // system hook


      sm.hook("before", () => {
        waiting = true;

        if (inspector) {
          inspector.collect(suid, 0);
        }

        if (discrete) {
          waiting = false;
        }
      }, 0); // observers hook

      observers[0].forEach(fn => sm.hook("before", fn, 1));

      function dispatch(payload) {
        if (!discrete && waiting) {
          throw new Error("\n          Can't dispatch action while sequence source is being processed,\n          if 'discrete dispatch' is expected, pass 'true' to parameter\n          called 'discrete' of 'createSource'.\n          The current type is ".concat(type, ".\n        "));
        }

        const action = {
          type,
          payload
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

      return types.map(type => createDispatch(type));
    }

    function isDiscrete() {
      return !!discrete;
    }

    function isWaiting() {
      return waiting;
    }

    return {
      observe,
      isDiscrete,
      isWaiting,
      hasType,
      createDispatch,
      createDispatches
    };
  }

  exports.createSource = createSource;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
