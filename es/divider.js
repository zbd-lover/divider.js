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

function isPlainObject(obj) {
  if (_typeof(obj) !== 'object') {
    return false;
  }
  return Object.getPrototypeOf(obj) === Object.prototype;
}

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * @param {object} obj 
 * @param {Array<String>} shape 
 */
function verifyShape(obj, shape, host) {
  if (isPlainObject(obj)) {
    if (shape.some((key) => !hasOwn.call(obj, key))) {
      throw new Error(`Expected the ${host || 'obj'} must own keys: ${shape.join(' ')}`);
    }
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

/**
 * Creates a state machine when a action is dispatched.
 * Each task should own respective state machine,
 * so we can be able to observe status of each task.
 * @returns {StateMachine} hook, start and end, they are functions.
 * start and end is used for marking processor's status.
 * hook let's do something before processor works or after worked
 */

function creatStateMachine() {
  let hooks = [[], []];
  let processing = false;

  function startWork() {
    if (processing) {
      throw new Error(`SM has started work!`);
    }
    processing = true;
    hooks[0].slice(0).reverse().forEach((hook) => hook());
  }

  function endWork() {
    if (!processing) {
      throw new Error(`SM has ended work!`);
    }
    processing = false;
    hooks[1].slice(0).reverse().forEach((hook) => hook());
  }

  /**
   * @param {number | string} tag 0 "after" 1 "before" hook's target
   * @param {Function} fn function do something else
   */
  function hook(tag, fn) {
    if (_typeof(tag) === 'undefined') {
      hooks = hooks.map((hook) => hook.slice(0, 1));
      return;
    }

    let index = tag;
    if (_typeof(index) !== 'number') {
      if (index === 'before') {
        index = 0;
      } else if (index === 'after') {
        index = 1;
      } else {
        throw new Error(`Invalid tag as string, valid tag is one of 'after' or'before'.`);
      }
    }

    if (index === 0 || index === 1) {
      if (_typeof(fn) === 'undefined') {
        hooks[index].splice(1,1);
      } else if (_typeof(fn) === 'function') {
        if (hooks[index].length === 2) {
          hooks[index] = fn;
        } else {
          hooks[index].push(fn);
        }
      } else {
        throw new Error(`Expected the fn as function. Instead, received: ${_typeof(fn)}.`);
      }
    } else {
      throw new Error(`Invalid tag as number, valid tag is 0 or 1.`);
    }
  }

  return {
    hook,
    startWork,
    endWork
  }
}

/**
 * @param {Function} process is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {source}
 */
function createSource(process, discrete) {

  if (_typeof(process) !== 'function') {
    throw new Error(`Expected the process as a function. Instead, received: ${_typeof(process)}`);
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
    if (_typeof(type) !== "string") {
      throw new Error(
        `Parameter called task expects a string, but received: ${_typeof(type)}`
      );
    }

    let _listener = {
      target: type,
      callback: listener,
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

  const inspector = createInspector();

  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false only happened at time all listeners called
   * otherwise, after action dispatched.
   */
  let waiting = false;

  let dispatchMapHook = [];

  function hook(dispatch, tag, fn) {
    const couple = dispatchMapHook.find((couple) => couple[0] === dispatch);
    if (couple) {
      couple[1](tag, fn);
      return;
    }
    console.warn(`Doesn't exist hook for the dispatch.`);
  }

  let uid = 0;

  /**
   * Create a dispatch and hook for one specified task you want.
   * If your source is discrete, each dispatch not specified type will create a state machine, 
   * it's a little necessary. If we have certain operations of source,
   * we can 'pre-create' the each dispatch with the 'type' parameter,
   * then, just use these dispatchs.
   * @param {string} type Describes what is the action.
   * @returns {dispatch} dispatchs action to your processor.
   * if the type specified as string, parameter called action of the dispatch always own 'type' key with the string
   */
  function createDispatch(type) {
    if (_typeof(type) === 'string' && !type) {
      throw new Error(`Expected the type is not empty as a string. Instead, receive: ${type}`);
    }

    const hasDefaultType = _typeof(type) === 'string' && type;

    const { hook, startWork, endWork } = creatStateMachine();

    let suid = uid++;

    hook('after', () => {
      if (inspector) {
        inspector.collect(suid, 1);
      }
      if (!discrete) {
        waiting = false;
      }
    });

    const createNotify = (action) => (datasource) => {
      let currentListeners = nextListeners.filter(
        (listener) => listener.target === action.type
      );
      try {
        currentListeners.forEach((listener) => listener.callback(datasource, action));
      } catch (e) {
        console.log(e);
      }
      endWork();
    };

    let _action = {
      type,
    };

    hook('before', () => {
      waiting = true;
      if (inspector) {
        inspector.collect(suid, 0);
      }
      process(_action, createNotify(_action));
      if (discrete) {
        waiting = false;
      }
    });

    const dispatch = (action) => {
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
      }

      if (hasDefaultType) {
        _action = { type, payload: action };
      } else {
        verifyShape(action, ['type'], 'action');
        _action = action;
      }

      startWork();
    };

    dispatchMapHook.push([dispatch, hook]);

    return dispatch;
  }

  function isDiscrete() {
    return !!discrete;
  }

  function isWaiting() {
    return waiting;
  }

  return {
    hook,
    isDiscrete,
    isWaiting,
    createDispatch,
    addTaskListener
  }
}

export { createSource };
