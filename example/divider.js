var divider = (function () {
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
    interval: [1500, 2000],
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

  // 在生产模式下默认开启
  function createInspector() {
    let option;
    try {
      option = process.env.NODE_ENV === 'production' ? getProdOption() : getDevOption();
    } catch (e) {
      option = getProdOption();
    }
    if (!option.enabled) {
      return null;
    }
    // It's used for verifing 'dispatch times' and 'response times' are matched.
    // [ [0, 1], [0, null], [0, 1] ]
    const couples = [];
    // to avoid making bad effect on program
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

      if (suspects.some((suspect) => suspect >= option.tolerance)) {
        const text = `
        You maybe forget to call 'notify' in 'process' function.
        It's maybe make bad effect for your 'hook for dispatch',
        or source is 'sequence', yet.
      `;
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
      collect,
    }
  }

  const indexMap = [
    ["before", 0],
    [0, 0],
    ["0", 0],
    ["after", 1],
    [1, 1],
    ["1", 1]
  ];

  function transformIndex(key) {
    const couple = indexMap.filter((item) => item[0] === key).map((item) => item[1]);
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
    Matchs value by tag
    if none, throw error.
   * @param {"before" | 0 | "0" | "after" | "1" | 1} tag as index
   * @returns {number} indexed value
   */
  function validateTag(tag) {
    let index = transformIndex(tag);
    if (_typeof(tag) === 'undefined') {
      throw new Error(`
      Invalid tag.Expected: "before", "0", 0, "after", "1", 1. Instead, received: ${tag}
    `)
    }
    return index;
  }

  /**
   * Creates a state machine when a action is dispatched.
   * Each task should own respective state machine,
   * so we can be able to observe status of each task.
   * @returns {StateMachine} hook, start and end, they are functions.
   * start and end is used for marking processor's status.
   * hook let's do something before processor works or after worked
   */

  function creatStateMachine(number = 3) {
    const hooks = [[], []];
    let processing = false;
    for (let i = 1; i <= number; i++) {
      hooks[0].push([]);
      hooks[1].push([]);
    }

    function hook(tag, fn, pos) {
      const index = validateTag(tag);
      if (_typeof(fn) !== 'function') {
        throw new Error(`
        Expected the fn as a function. Instead, received: ${_typeof(fn)}.
      `);
      }
      hooks[index][pos].push(fn);
    }

    function startWork(action) {
      if (processing) {
        throw new Error(`SM has started work!`);
      }
      processing = true;
      hooks[0].flat().forEach((hook) => hook(action));
    }

    function endWork(datasource, action) {
      if (!processing) {
        throw new Error(`SM has ended work!`);
      }
      processing = false;
      hooks[1].flat().forEach((hook) => hook(datasource, action));
    }

    return {
      hook,
      startWork,
      endWork
    }
  }

  /**
   * @param {Processor} process is consist of all relative operations of data.
   * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
   * @returns {Source}
   */
  function createSource(process, discrete) {

    if (_typeof(process) !== 'function') {
      throw new Error(`Expected the process as a function. Instead, received: ${_typeof(process)}`);
    }

    const inspector = createInspector();

    /**
     * Can we dispatch the next action right now?
     * Sets waiting true when processor starts working.
     * If source is discrete, set it false only happened at time all listeners called
     * otherwise, after action dispatched.
     */
    let waiting = false;

    const dispatchMapSM = [];

    // The observers behavior look likes midddlware.
    // starting and ending of any dispatch can be observed.
    // observers[0] -> starting
    // observers[1] -> ending
    const observers = [[], []];

    /**
     * Observe dispatch.
     * @param {string} type  whom we observe
     * @param {Tag} tag observing time
     * @param {HookForE | HookForS} fn what something we want to do, if the type is observed.
     */
    function observe(type, tag, fn) {
      // Function signature looks like observe(tag, fn).
      if (_typeof(tag) === 'function' && _typeof(type) !== 'undefined' && _typeof(fn) === 'undefined') {
        let index = validateTag(type);
        observers[index].push(tag);
        return;
      }

      const couple = dispatchMapSM.find((couple) => couple[0] === type);
      if (couple) {
        let index = validateTag(tag);
        couple[1].hook(tag, fn, index === 0 ? 2 : 1);
        return;
      }

      console.warn(`Doesn't exist hook for the dispatch with type: ${type}.`);
    }

    // It's used to do index state machie by the type.
    // Inspector uses it to want know who is processing, too.
    let uid = 0;

    /**
     * Create a dispatch and  for task you want.
     * We need 'pre-create' the each dispatch with the 'type', then, just use these dispatchs.
     * @param {string} type Describes what is the action.
     * @returns {Dispatch<T>} Function A that dispatchs action to your processor.
     * if the type specified as string, parameter called action of the dispatch always own 'type' key with the string
     */
    function createDispatch(type) {
      if (_typeof(type) !== 'string' || !type) {
        throw new Error(`
        Expected the type as a string and not empty.
        Instead, type received${_typeof(type)}, value received:${type}
      `);
      }

      // 将状态机的钩子函数分为三个部分，以实现优先级
      const sm = creatStateMachine(3);
      const suid = uid++;

      // system hook
      sm.hook(
        'after',
        () => {
          if (inspector) {
            inspector.collect(suid, 1);
          }
          if (!discrete) {
            waiting = false;
          }
        },
        2
      );
      // observers hook
      observers[1].forEach((fn) => sm.hook(1, fn, 0));

      const createNotify = (action) => (datasource) => sm.endWork(datasource, action);

      let _action = {
        type,
      };

      // system hook
      sm.hook(
        'before',
        () => {
          waiting = true;
          if (inspector) {
            inspector.collect(suid, 0);
          }
          if (discrete) {
            waiting = false;
          }
        },
        0
      );
      // observers hook
      observers[0].forEach((fn) => sm.hook(0, fn, 1));

      const dispatch = (action) => {
        if (!discrete && waiting) {
          throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
        }
        _action = {
          type,
          payload: action
        };
        sm.startWork(_action);
        process(_action, createNotify(_action));
      };

      dispatchMapSM.push([type, sm]);

      return dispatch;
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
      createDispatch,
    }
  }

  function createDivider() {
    const CURRENT_SOURCES_MAP = [];

    function _createSource_(name, processor, discrete) {
      if (!name) {
        discrete = processor;
        processor = name;
      }
      const source = createSource(processor, !!discrete);
      CURRENT_SOURCES_MAP.push([name, source]);
      return source;
    }

    return {
      createSource: _createSource_,
      CURRENT_SOURCES_MAP: CURRENT_SOURCES_MAP,
    }
  }

  const divider = createDivider();

  return divider;

})();
