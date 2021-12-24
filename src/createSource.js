import extend from "./util/extend";
import __typeof__ from "./util/typeof";

/**
 * Creates a divided source that is 'discrete' or 'sequence'. 
 * Source only care about order of action to change it.
 * If source as 'sequence', source only can be changed one action by one action,
 * sequence can look like 'sync', 'discrete' looks like 'async'.
 * @param {Function} process 
 * @param {Boolean} discrete source is 'discrete' or 'sequence'
 * @param {Boolean} strict 
 * @returns {Source}
 */

function createSource(process, discrete, strict = true) {

  let nextListeners = [];
  let currentStatus = null;

  /**
   * Adds a listener for specified action,
   * it's called when the specified action is dispatched, then,
   * 'datasoure' and 'action' will as parameter pass to it.
   * @param {string} type decription of action
   * @param {Function} listener your specified listener
   * @returns {Function} Function A remove the specified listener
   */
  function addActionListener(type, listener) {
    if (__typeof__(type) !== "string") {
      throw new Error(
        `Parameter called type expects a string, but received: ${__typeof__(type)}`
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

  function decorateListener(listener, callback) {
    return (datasource, action) => {
      listener.callback(datasource, action);
      callback();
    };
  }

  // Normally, dispatching of each action hopes a response.
  // They are used for verifing 'dispatch times' and 'response times' are matched.
  // Program will throw Error when they are not matched, 
  // when the parameter named 'strict' of 'createSource' is 'true' .
  let sendTimes = 0;
  let receiveTimes = 0;

  /**
   * Verifys 'dispatch times' and 'response times' are matched.
   * @returns {Boolean} result matched
   */
  function verifyTimes() {
    if (sendTimes !== receiveTimes) {
      if (strict) {
        throw new Error(`
          You maybe forget to call 'notify' in last 'process' function.
          It's as expected?, we can pass 'false' to parameter called 'strict'
          of 'createSource' to avoid this error;
        `);
      }
      receiveTimes = sendTimes;
    }
  }

  /**
   * Each dispatch will generate a new description of processing,
   * Cause 2
   * @param {Action} action 
   * @param {string | object} description 
   * @returns Dispatch
   */
  function makeDispatch(description) {
    if (__typeof__(description) !== 'string' && __typeof__(description) !== 'object') {
      throw new Error(`
        Expected the description is a string or object. Instead, received: ${__typeof__(description)}
      `);
    }

    verifyTimes();

    const status = extend(
      {},
      __typeof__(description) === 'string' ? { name: description } : description
    );
    status.processing = false;

    const startProcess = (fn) => {
      status.processing = true;
      fn();
    };

    const endProcess = () => {
      status.processing = false;
      if (currentStatus === status) {
        currentStatus = null;
      }
    };

    const createNotify = (action) => (datasource) => {
      receiveTimes++;
      let currentListeners = nextListeners.filter(
        (listener) => listener.target === action.type
      );
      let len = currentListeners.length;
      currentListeners = currentListeners.map((listener, index) =>
        discrete
          ? decorateListener(listener, () => { })
          // If source is sequence, only ends processing 
          // when datasource dispatched as parameter to all listener.
          : decorateListener(
            listener,
            () => index === len - 1 ? endProcess() : undefined
          )
      );

      try {
        currentListeners.forEach((listener) => listener(datasource, action));
      } catch (e) {
        console.log(e);
      }
    };

    return (action) => {
      if (!discrete && currentStatus && currentStatus.processing) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
      }
      sendTimes++;
      currentStatus = status;
      startProcess(() => process(action, createNotify(action)));
      if (discrete) {
        endProcess();
      }
      return status;
    };
  }

  function __dispatch__(action) {
    return makeDispatch()(action);
  }

  const ref = {
    dispatch: __dispatch__
  };

  function setDispatch(dispatch) {
    ref.dispatch = dispatch;
  }

  function resetDispatch() {
    ref.dispatch = __dispatch__;
  }

  function isDiscrete() {
    return discrete;
  }

  return {
    isDiscrete,
    dispatch(action) {
      return ref.dispatch(action);
    },
    makeDispatch,
    setDispatch,
    resetDispatch,
    addActionListener,
  };
}

export default createSource;