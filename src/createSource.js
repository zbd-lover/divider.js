import _typeof from "./util/typeof";
import filterNullValues from "./util/filterNullValues";
import createInspector from "./inspector";
import creatStateMachine, { validateTag } from "./statemachine";

/**
 * 每一个action都有自己对应的state machine,
 * state machine可以被监听，可被监听的时间点有4个: 开始工作前, 结束工作后, 打断工作后.
 * Observe api让我们对action进行监听，实际上我们监听的是对应的state machine.
 * 系统内部会监听它，同时，使用者可以对特定的action监听或任意的action监听.
 * 监听的回调函数是有顺序的，下面是顺序的描述对象
 * （对任意action监听的回调函数发生在特定action的之前）
 * ------------------------------------------------
 * Each action owns respective state machine.
 * The state machine can be observed, allowed times are: before working, after worked, after interrupted.
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

  // item: [type, state machine, dispatch, interrupt];
  let groups = [];

  function record(type, sm, dispatch) {
    groups.push([type, sm, dispatch]);
  }

  function findGroup(type) {
    return groups.find((group) => group[0] === type)
  }

  function interrupt(type) {
    let group = findGroup(type);
    if (group) {
      group[3]();
      return;
    }
    console.warn(`Doesn't exist the type named ${type}. can't interrupt`);
  }

  function hasType(type) {
    return !!findGroup(type);
  }

  function getDispatch(type) {
    let group = findGroup(type)
    if (group) {
      return group[2];
    }
  }

  /**
   * 0 -> before action working.
   * 1 -> after action worked.
   * 2 -> after action interrupted.
   */
  let observers = [[], [], []];
  let unloaders = [[], [], []];

  let resetCounts = 0;

  /**
   * Observe dispatch.
   * @param {string} type  whom we observe
   * @param {Tag} tag observing time
   * @param {Function} fn what something we want to do, if the type is observed.
   */
  function observe(type, tag, fn) {
    // Function signature looks like observe(tag, fn).
    if (_typeof(tag) === 'function' && _typeof(type) !== 'undefined' && _typeof(fn) === 'undefined') {
      return observeAll(type, tag);
    }
    return observeOne(type, tag, fn);
  }

  function observeAll(tag, fn) {
    let currentResetCounts = resetCounts;
    let index = validateTag(tag);
    let len = observers[index].length;
    observers[index][len] = fn;
    unloaders[index][len] = {};
    let released = false;
    return () => {
      if (!released && currentResetCounts === resetCounts && unloaders[index].length >= len) {
        for (let [, unload] of Object.entries(unloaders[index][len])) {
          unload();
        }
        observers[index][len] = null;
      }
    }
  }

  function observeOne(type, tag, fn) {
    if (!hasType(type)) {
      console.warn(`Cant't observe action before created, the action's type is ${type}.`);
      return;
    }
    let index = validateTag(tag);
    let group = groups.find((group) => group[0] === type);
    let positon = 0;
    switch (index) {
      case 0:
        positon = HOOK_ORDER_MAP['before'].user;
        break;
      case 1:
        positon = HOOK_ORDER_MAP['after'].user;
        break;
      case 2:
        positon = HOOK_ORDER_MAP['interrupt'].user;
        break;
      default:
        break;
    }
    return group[1].hook(
      tag,
      (arg1, arg2) => {
        let isBefore = index === 0;
        let isAfter = index === 1;
        let isInterrupt = index == 2;
        if (isInterrupt && arg1 === type) {
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
      positon
    );
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
    let currentResetCounts = resetCounts;

    if (hasType(type)) {
      console.warn(`The dispatch of type has existed: ${type}`);
      return;
    }

    // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The system_hook is used for developer to control 'waiting' and something necessary.
    let sm = creatStateMachine(type);
    let currentWorkUnit;

    // createDispatch will return it.

    function dispatch(payload) {
      if (currentResetCounts !== resetCounts) {
        console.log(`Invalid dispatch, because the source has reseted, the type is ${type}`);
        return
      }
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
          The current type is ${type}.
        `);
      }
      if (currentWorkUnit && discrete) {
        currentWorkUnit.interrupt();
      }
      let workUnit = sm.createWorkUnit();
      currentWorkUnit = workUnit;
      let action = {
        type,
        payload
      }
      let group = findGroup(type);
      if (group) {
        // current interrupt
        group[3] = workUnit.interrupt;
      }

      workUnit.startWork(action);
      processor(action, (datasource) => workUnit.endWork(datasource, action));
    }

    let suid = uid++;

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
    filterNullValues(observers[0]).forEach((fn, i) => unloaders[0][i][type] = sm.hook("before", fn, HOOK_ORDER_MAP["before"].observer))

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
    filterNullValues(observers[1]).forEach((fn, i) => unloaders[1][i][type] = sm.hook("after", fn, HOOK_ORDER_MAP["after"].observer));

    // Bind Hooks for 'interrupt'
    sm.hook(
      "interrupt",
      () => {
        // inspector is able to collect 'start' of action, opposite, is not.
        if (inspector) {
          inspector.collect(suid, 1);
        }
        waiting = false;
      },
      HOOK_ORDER_MAP["interrupt"].system
    );

    // observers' hooks
    filterNullValues(observers[2]).forEach((fn, i) => unloaders[2][i][type] = sm.hook("interrupt", fn, HOOK_ORDER_MAP["interrupt"].observer));

    record(type, sm, dispatch);
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

  function reset() {
    groups.forEach((group) => {
      // interrupts all available action.
      if (_typeof(group[3]) === 'function'){
        group[3]();
      }
      group[1].reset();
    });
    groups = [];
    if (inspector) {
      inspector.destroy();
    }
    inspector = createInspector();
    observers = [[], [], []];
    unloaders = [[], [], []];
    waiting = false;
    resetCounts++
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