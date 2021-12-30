import _typeof from "./util/typeof";
import createInspector from "./inspector";
import creatStateMachine, { validateTag } from "./statemachine";

/**
 * @param {Processor} processor is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {Source} let's observe specific op of source and dispatch them.
 */
function createSource(processor, discrete) {

  if (_typeof(processor) !== 'function') {
    throw new Error(`Expected the process as a function. Instead, received: ${_typeof(processor)}`);
  }

  const inspector = createInspector();

  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false happened at time when processor stop working,
   * otherwise, after action dispatched.
   */
  let waiting = false;

  // Type of action maps its state machine
  const typeMapSM = [];

  function hasType(type) {
    return !!typeMapSM.find((map) => map[0] === type);
  }

  // starting and ending of any dispatch can be observed, or creating dispatch.
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
      delays.push({ type, tag, fn });
      return type;
    }
    const couple = typeMapSM.find((couple) => couple[0] === type);
    const index = validateTag(tag);
    const isBefore = index === 0;
    const isCreate = index === 2;
    couple[1].hook(
      tag,
      (arg1, arg2) => {
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
      },
      isCreate ? 1 : isBefore ? 2 : 1
    );
    return type;
  }

  function tryRunDelay(type) {
    if (!hasType(type)) {
      return;
    }
    let index = delays.findIndex((delay) => delay.type === type);
    if (index < 0) {
      return;
    }
    let { tag, fn } = delays.splice(index, 1)[0];
    observeOne(type, tag, fn);
    tryRunDelay(type);
  }

  // It's used to do index state machie by the type.
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
      throw new Error(`
        Expected the type as a string and not empty.
        Instead, type received${_typeof(type)}, value received:${type}
      `);
    }

    if (typeMapSM.find((map) => map[0] === type)) {
      throw new Error(`The type has existed: ${type}`);
    }

    // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The observer_hook is called always before custom_hook.
    // The system_hook is used for developer to control 'waiting' and something necessary.
    const sm = creatStateMachine(type, 3);
    observers[2].forEach((fn) => sm.hook("create", fn, 0));

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
    observers[1].forEach((fn) => sm.hook("after", fn, 0));

    const createNotify = (action) => (datasource) => sm.endWork(datasource, action);

    // system hook
    sm.hook(
      "before",
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
    observers[0].forEach((fn) => sm.hook("before", fn, 1));

    function dispatch(payload) {
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
          The current type is ${type}.
        `);
      }
      const action = {
        type,
        payload
      }
      sm.startWork(action);
      processor(action, createNotify(action));
    }

    typeMapSM.push([type, sm]);

    tryRunDelay(type);

    return dispatch;
  }

  /**
   * Creates some dispatches.
   * @param {Array<string>} types 
   */
  function createDispatches(...types) {
    return types.map((type) => createDispatch(type));
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
    createDispatches,
  }
}

export default createSource;