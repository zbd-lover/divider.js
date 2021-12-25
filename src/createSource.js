import extend from "./util/extend";
import _typeof from "./util/typeof";
import verifyShape from "./util/verifyShape";

const defaultInsepctor = {
  enabled: false,
  error: true,
  interval: 2000,
  tolerance: 3,
}

/**
 * @param {Function} process is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {source}
 */
function createSource(process, discrete, inspectorOption) {

  if (_typeof(process) !== 'function') {
    throw new Error(`Expected the process as a function. Instead, received: ${_typeof(process)}`);
  }

  if (_typeof(discrete) !== 'undefined' && _typeof(discrete) !== 'object') {
    inspectorOption = discrete;
  }

  let _inspectorOption;

  if (inspectorOption && _typeof(inspectorOption) !== 'object') {
    throw new Error(`Expected the inspect as a object. Instead, received: ${_typeof(inspectorOption)}`);
  } else {
    _inspectorOption = extend(extend({}, defaultInsepctor), inspectorOption || {});
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
    }

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
        throw new Error('')
      }
      if (_typeof(hooks[0]) === 'function') {
        hooks[0]();
      }
      processing = true;
      if (effect) {
        effect();
      }
    }

    function end(effect) {
      if (!processing) {
        throw new Error('')
      }
      if (_typeof(hooks[1]) === 'function') {
        hooks[1]();
      }
      processing = false;
      if (effect) {
        effect();
      }
    }

    function hook(tag, fn) {
      if (_typeof(tag) === 'undefined') {
        hooks = [];
        return;
      }
      let index = tag;
      if (_typeof(index) !== 'number') {
        if (index === 'before') {
          index = 0;
          return
        }
        if (index === 'after') {
          index = 1;
          return
        }
        throw new Error(`Invalid tag as string, valid tag is one of 'after' or'before'.`);
      }
      if (index === 0 || index === 1) {
        if (_typeof(fn) === 'undefined') {
          hooks[index] = undefined;
        } else if (_typeof(fn) === 'function') {
          hooks[index] = fn;
        } else {
          throw new Error(`Expected the fn as function. Instead, received: ${_typeof(fn)}.`);
        }
      } else {
        throw new Error(`Invalid tag as number, valid tag is one of '0' or '1'.`);
      }
    }
    suid++;

    return {
      hook,
      start,
      end,
      uid: suid
    }
  }

  function createInspector() {
    // It's used for verifing 'dispatch times' and 'response times' are matched.
    // [ [0, 1], [0, null], [0, 1] ]
    const couples = [];
    // to avoid making bad effect program
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

      if (suspects.some((suspect) => suspect >= _inspectorOption.tolerance)) {
        const text = `
          You maybe forget to call 'notify' in 'process' function.
          It's maybe make bad effect for your 'hook for dispatch',
          or source is 'sequence', yet.
        `;
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
      collect,
    }
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
    if (_typeof(type) === 'string' && !type) {
      throw new Error(`Expected the type is not empty as a string. Instead, receive: ${type}`);
    }

    const { hook, start, end, uid } = creatStateMachine();

    const createNotify = (action) => (datasource) => {
      end(() => {
        if (inspector) {
          inspector.collect(uid, 1);
        }
        if (!discrete) {
          waiting = false;
        }
      });
      let currentListeners = nextListeners.filter(
        (listener) => listener.target === action.type
      );
      try {
        currentListeners.forEach((listener) => listener.callback(datasource, action))
      } catch (e) {
        console.log(e);
      }
    };

    const dispatch = (action) => {
      verifyShape(action, ['type'], 'action');
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
      }
      let _action = extend({}, action);
      _action.type = type ? type : action.type;

      start(
        () => {
          waiting = true;
          if (inspector) {
            inspector.collect(uid, 0);
          }
          process(_action, createNotify(_action))
          if (discrete) {
            waiting = false;
          }
        }
      );
    }

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
  }

  if (!discrete) {
    source.hook = syncHook;
  }

  return source;
}

createSource(() => {});

export default createSource;