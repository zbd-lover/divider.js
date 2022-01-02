import _typeof from "./util/typeof";
import createInspector from "./inspector";
import creatStateMachine, { validateTag } from "./statemachine";

/**
 * 每一个action都有自己对应的state machine,
 * state machine可以被监听，可被监听的时间点有4个: 开始工作前, 结束工作后, 创建时, 打断工作后.
 * Observe api让我们对action进行监听，实际上我们监听的是对应的state machine.
 * 系统内部会监听它，同时，使用者可以对特定的action监听或任意的action监听.
 * 监听的回调函数是有顺序的，下面是顺序的描述对象
 * （对任意action监听的回调函数发生在特定action的之前）
 * ------------------------------------------------
 * Each action owns respective state machine.
 * The state machine can be observed, allowed times are: before working, after worked, on creating, after interrupted.
 * ('Observe api' let us to observe the actions, actually, the state machines are real target.)
 * We will observe actions inside the system to do something necessary, and user can observe any action or specific action.
 * Callbacks of observations are order, the follwing is order-object
 * (Observations of any action  are notified at first, then observations of specific action. )
 */

const HOOK_ORDER_MAP = {
  before: {
    system: 0,
    // any
    observer: 1,
    // specific
    user: 2,
  },
  after: {
    observer: 0,
    user: 1,
    system: 2,
  },
  create: {
    system: 0,
    observer: 1,
    user: 2,
  },
  interrupt: {
    observer: 0,
    user: 1,
    system: 2,
  }
}

/**
 * @param {Processor} processor is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {Source} let's observe specific op of source and dispatch them.
 */
function createSource(processor, discrete) {

  if (_typeof(processor) !== 'function') {
    throw new Error(`Expected the process as a function. Instead, received: ${_typeof(processor)}`);
  }

  let inspector = createInspector();

  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false happened at time when processor stop working,
   * otherwise, after action dispatched.
   * If action is interrupted, right now, sets waiting false;
   */
  let waiting = false;

  // item: [type, state machine, dispatch];
  let groups = [];

  function hasType(type) {
    return !!groups.find((group) => group[0] === type);
  }

  function getDispatch(type) {
    const group = groups.find((group) => group[0] === type);
    if (group) {
      return group[2];
    }
  }

  /**
   * 0 -> before action working.
   * 1 -> after action worked.
   * 2 -> on creating of action.
   * 3 -> after action interrupted.
   */
  let observers = [[], [], [], []];
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

  let delays = [];
  function observeOne(type, tag, fn) {
    if (!hasType(type)) {
      delays.push({ type, tag, fn });
      return type;
    }
    const index = validateTag(tag);
    const couple = groups.find((couple) => couple[0] === type);
    let pos = 0;
    switch (index) {
      // before
      case 0:
        pos = HOOK_ORDER_MAP['before'].user;
        break;
      // after
      case 1:
        pos = HOOK_ORDER_MAP['after'].user;
        break;
      // create
      case 2:
        pos = HOOK_ORDER_MAP['create'].user;
        break;
      // interrupt
      case 3:
        pos = HOOK_ORDER_MAP['interrupt'].user;
        break;
      default:
        break;
    }
    couple[1].hook(
      tag,
      (arg1, arg2) => {
        let isBefore = index === 0;
        let isAfter = index === 1;
        let isCreate = index === 2;
        let isInterrupt = index == 3;
        if ((isCreate || isInterrupt) && arg1 === type) {
          // fn(action.type)
          fn(type);
          return;
        }
        if (isBefore) {
          // fn(action);
          fn(arg1);
          return;
        }
        if (isAfter) {
          // fn(datasource, action)
          fn(arg1, arg2);
          return;
        }
        console.warn(`Unknown index: ${index}, this means unknown hook.`);
      },
      pos
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
    // It's possible that one type's some delays exists  at same time, e.g before and create
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
        Instead, type received:${_typeof(type)}, value received:${type}
      `);
    }

    if (hasType(type)) {
      console.warn(`The type has existed: ${type}`);
      return;
    }

    // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The system_hook is used for developer to control 'waiting' and something necessary.
    const sm = creatStateMachine(type, 3, (sm) => {
      observers[2].forEach((fn) => sm.hook("create", fn, HOOK_ORDER_MAP['create'].observer));
      groups.push([type, sm, dispatch]);
      tryRunDelay(type);
    });

    // createDispatch will return it.
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
      processor(action, (datasource) => sm.endWork(datasource, action));
    }

    const suid = uid++;

    // Bind hooks:

    // Hooks for 'before':
    // system
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
      HOOK_ORDER_MAP["before"].system
    );
    // observers' hooks
    observers[0].forEach((fn) => sm.hook("before", fn, HOOK_ORDER_MAP["before"].observer));

    // Binds Hooks for 'after'
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
      HOOK_ORDER_MAP["before"].system
    );
    // observers' hooks
    observers[1].forEach((fn) => sm.hook("after", fn, HOOK_ORDER_MAP["after"].observer));

    // Bind Hooks for 'interrupt'
    sm.hook(
      "interrupt",
      (name) => {
        console.log(`Action named '${name}' is interrupted before worked completely.`);
        // inspector is able to collect 'start' of action, opposite, is not.
        if (inspector) {
          inspector.collect(suid, 1);
        }
        waiting = false;
      },
      HOOK_ORDER_MAP["interrupt"].system
    );

    // observers' hooks
    observers[3].forEach((fn) => sm.hook("interrupt", fn, HOOK_ORDER_MAP["interrupt"].observer));

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

  /**
   * @param {Action} action 
   */
  function dispatch(action) {
    let dispatch;
    if (hasType(action.type)) {
      dispatch = getDispatch(action.type)
    } else {
      dispatch = createDispatch(action.type);
    }
    dispatch(action.payload);
    return dispatch;
  }

  function interrupt(type) {
    const group = groups.find((group) => group[0] === type);
    if (group) {
      group[1].interrupt()
      return;
    }
    console.warn(`Doesn't exist the type named ${type}.`);
  }

  function reset() {
    groups.forEach((group) => group[1].reset());
    groups = [];
    if (inspector) {
      inspector.destroy();
      inspector = createInspector();
    }
    delays = [];
    observers = [];
    waiting = false;
  }

  return {
    observe,
    isDiscrete,
    isWaiting,
    reset,
    hasType,
    dispatch,
    interrupt,
    createDispatch,
    createDispatches,
  }
}

export default createSource;