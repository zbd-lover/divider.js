import extend from "./util/extend";
import _typeof from "./util/typeof";

/**
 * Creates a divided source that is 'discrete' or 'sequence'. 
 * Source only care about order of action to change it.
 * If source as 'sequence', source only can be changed one action by one action,
 * sequence can look like 'sync', 'discrete' looks like 'async'.
 * @param {Function} process 
 * @param {Boolean} discrete source is 'discrete' or 'sequence'
 * @returns {Source}
 */

function createSource(process, discrete, strict = true) {

  let nextListeners = [];

  /**
   * Adds a listener for specified action,
   * it's called when the specified action is dispatched, then,
   * 'datasoure' and 'action' will as parameter pass to it.
   * @param {string} type decription of action
   * @param {Function} listener your specified listener
   * @returns {Function} Function A remove the specified listener
   */
  function addActionListener(type, listener) {
    if (_typeof(type) !== "string") {
      throw new Error(
        `Parameter called type expects a string, but received: ${_typeof(type)}`
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
          It's necessary, if not, your last dispatch never ends.
          It's maybe make bad effect for your 'hook for dispatch', or source is 'sequence', yet.
          However, if it's as expected, we can pass 'false' to parameter called 'strict' of 'createSource' to avoid this constraint.
        `);
      }
      return false;
    }
    return true;
  }

  /**
   * ...
   */
  let waiting = false;

  /**
   * Each dispatch will generate a new description of processing,
   * Cause 2
   * @param {Action} action 
   * @param {string | object} description 
   * @returns Dispatch
   */
  function createDispatch(description) {
    if (_typeof(description) !== 'string' && _typeof(description) !== 'object') {
      throw new Error(`Expected the description is a string or object. Instead, received: ${_typeof(description)}`);
    }

    if (_typeof(description) === 'string' && !description) {
      throw new Error(`Expected the description is not empty as a string. Instead, receive: ${description}`);
    }

    if (_typeof(description) === 'object' && (!description.type || _typeof(description.type) !== 'string')) {
      throw new Error(`
        Expected the description must own 'type' key that is a string type and not empty. Instead, 
        the type is: ${_typeof(description.type)}, 
        the value is: ${description.type}}
      `);
    }

    const status = extend(
      extend(
        {},
        _typeof(description) === 'string' ? { description } : (description || {})
      ),
      { processsing: false }
    );

    function startProcess(work) {
      waiting = true;
      sendTimes++;
      status.processing = true;
      work();
      if (discrete) {
        waiting = false;
      }
    }

    function endProcess() {
      receiveTimes++;
      status.processing = false;
    }

    const createNotify = (action) => (datasource) => {
      endProcess();
      let currentListeners = nextListeners.filter(
        (listener) => listener.target === action.type
      );
      try {
        currentListeners.forEach((listener) => listener.callback(datasource, action))
      } catch (e) {
        console.log(e);
      }
    };

    return (action) => {
      verifyTimes();
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
      }
      startProcess(() => process(action, createNotify(action)));
      return status;
    };
  }

  /** default dispatch */
  function _dispatch(action) {
    return createDispatch()(action);
  }

  const ref = {
    dispatch: _dispatch
  };

  function setDispatch(dispatch) {
    ref.dispatch = dispatch;
  }

  function resetDispatch() {
    ref.dispatch = _dispatch;
  }

  function isDiscrete() {
    return discrete;
  }

  function isWaiting() {
    return waiting;
  }

  return {
    isDiscrete,
    isWaiting,
    dispatch(action) {
      return ref.dispatch(action);
    },
    createDispatch,
    setDispatch,
    resetDispatch,
    addActionListener,
  };
}

export default createSource;