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

  const inspector = createInspector();

  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false only happened at time all listeners called
   * otherwise, after action dispatched.
   */
  let waiting = false;

  const dispatchMapSM = [];

  const observers = [];

  function addObserver(observer) {
    if (_typeof(middleware) !== 'object') {
      console.warn(`
          Expected the middleware as a object, Instead, recevied: ${_typeof(middleware)}
        `);
      return false;
    }

    const { before, after } = observer;

    if (_typeof(before) !== 'function' && _typeof(before) !== 'undefined') {
      throw new Error(`
        Expected the before as a function. Instead, received: ${_typeof(before)},
      `);
    }

    if (_typeof(after) !== 'function' && _typeof(after) !== 'undefined') {
      throw new Error(`
        Expected the after as a function. Instead, received: ${_typeof(after)},
      `);
    }
    observers.push(observer);
  }

  // The hook let's do something specified for the dispatch
  function hook(dispatch, tag, fn) {
    const couple = dispatchMapSM.find((couple) => couple[0] === dispatch)
    if (couple) {
      couple[1].hook(tag, fn);
      return;
    }
    console.warn(`Doesn't exist hook for the dispatch.`);
  }

  // The observers behavior look likes midddlware
  // starting and ending of any dispatch will be observed.
  // observers of 'before' is called before normal hook.
  // observers of 'after' is called after normal hook.
  const observers = [];

  // Observe dispatch's 'before' and 'after'
  function observe(dispatch, tag, fn) {
    // Now, function signature looks like observe(tag, fn).
    if (_typeof(tag) === 'function' && _typeof(dispatch) !== 'undefined' && _typeof(fn) === 'undefined') {
      observers.push({ tag, fn });
      return;
    }
    const couple = dispatchMapSM.find((couple) => couple[0] === dispatch);
    if (couple) {
      couple[1].observe(tag, fn);
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

    const sm = creatStateMachine(observers);

    observers.forEach((observe) => sm.observe(observe.tag, observe.fn));

    const suid = uid++;

    sm.hook('after', () => {
      if (inspector) {
        inspector.collect(suid, 1);
      }
      if (!discrete) {
        waiting = false;
      }
    });

    const createNotify = (action) => (datasource) => sm.endWork(datasource, action);

    let _action = {
      type,
    }

    sm.hook('before', () => {
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

      sm.startWork();
    }

    dispatchMapSM.push([dispatch, sm]);

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
    observe,
    isDiscrete,
    isWaiting,
    createDispatch,
  }
}

export default createSource;