import _typeof from "./util/typeof";
import verifyShape from "./util/verifyShape";
import createInspector from "./inspector";
import creatStateMachine from "./statemachine";

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
    const couple = dispatchMapHook.find((couple) => couple[0] === dispatch)
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
        currentListeners.forEach((listener) => listener.callback(datasource, action))
      } catch (e) {
        console.log(e);
      }
      endWork();
    };

    let _action = {
      type,
    }

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
    }

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

export default createSource;