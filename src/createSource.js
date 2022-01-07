import _typeof from "./util/typeof";
import filterNullValues from "./util/filterNullValues";
import verifyShape from "./util/verifyShape";
import creatStateMachine, { validateTag } from "./util/statemachine";
import createLog from "./util/log";

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
 * We will observe actions inside the system to do something necessary,
 * and user can observe any action or specific action.
 * Callbacks of observations are order, the follwing is order-object
 * (Observations of any action  are notified at first, then observations of specific action. )
 */

const HOOK_ORDER_MAP = {
  start: {
    system: 0,
    // any
    observer: 1,
    // specific
    user: 2,
  },
  end: {
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

const DEFAULT_OPTION = {
  tip: {
    statemachine: false
  }
}

/**
 * @param {Processor} processor is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @param {Option} option extra config
 * @returns {Source} let's observe specific op of source and dispatch them.
 */
export default function createSource(processor, discrete, option = DEFAULT_OPTION) {
  if (_typeof(processor) !== 'function') {
    throw new Error(`Expected the process as a function. Instead, received: ${_typeof(processor)}`);
  }
  /**
   * Can we dispatch the next action right now?
   * Sets waiting true when processor starts working.
   * If source is discrete, set it false happened at time when processor stop working,
   * otherwise, after action dispatched.
   * If action is interrupted, right now, sets waiting false;
   */
  let waiting = false;

  /** group-item: [ type, statemachine, dispatch, interrupt ]; */
  let groups = [];

  /** save a group-item ( [ type, statemachine, dispatch, interrupt ] ) */
  let record = (type, sm, dispatch) => groups.push([type, sm, dispatch])
  let findGroup = (type) => groups.find((group) => group[0] === type);
  let getDispatch = (type) => !!findGroup(type) ? findGroup(type)[2] : null

  function interrupt(type) {
    let group = findGroup(type);
    if (group) {
      group[1].interrupt();
      return;
    }
    console.warn(`Doesn't exist the type named ${type}. can't interrupt`);
  }

  let util = {
    isDiscrete: () => !!discrete,
    isWaiting: () => waiting,
    hasType: (type) => !!findGroup(type)
  }

  /**
   * 0 -> before action working.
   * 1 -> after action worked.
   * 2 -> after action interrupted.
   */
  let observers = [[], [], []];
  let unloaders = [[], [], []];

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
    let index = validateTag(tag);
    let len = observers[index].length;
    observers[index][len] = fn;
    unloaders[index][len] = {};
    let released = false;
    return () => {
      if (!released && unloaders[index].length >= len) {
        for (let [, unload] of Object.entries(unloaders[index][len])) {
          unload();
        }
        observers[index][len] = null;
      }
    }
  }

  function observeOne(type, tag, fn) {
    if (!util.hasType(type)) {
      console.warn(`Cant't observe action before created, the action's type is ${type}.`);
      return;
    }
    let index = validateTag(tag);
    let group = findGroup(type);
    let positon = 0;
    switch (index) {
      case 0:
        positon = HOOK_ORDER_MAP['start'].user;
        break;
      case 1:
        positon = HOOK_ORDER_MAP['end'].user;
        break;
      case 2:
        positon = HOOK_ORDER_MAP['interrupt'].user;
        break;
      default:
        break;
    }
    return group[1].hook(
      tag,
      // this function looks like 'reloadsing of function'.
      (arg1, arg2) => {
        let isStart = index === 0;
        let isEnd = index === 1;
        let isInterrupt = index == 2;
        if (isInterrupt && arg1 === type) {
          // fn(action.type)
          fn(type);
          return;
        }
        if (isStart) {
          // fn(action);
          fn(arg1);
          return;
        }
        if (isEnd) {
          // fn(datasource, action)
          fn(arg1, arg2);
          return;
        }
        console.warn(`Unknown index: ${index}, this means unknown hook.`);
      },
      positon
    );
  }

  const logOfStateMachine = createLog(option.tip.statemachine);

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

    if (util.hasType(type)) {
      console.warn(`The dispatch of type has existed: ${type}`);
      return;
    }

    // This state machine own three kinds of hook, they are: system_hook, observer_hook and custom_hook(user_hook).
    // The observe_hook's action like middleware, because it can observe any dispatch of one source.
    // The system_hook is used for developer to control 'waiting' and something necessary.
    let sm = creatStateMachine(type, logOfStateMachine);

    // Each calling of dispatch owns individual status.
    // When action with type 'A' is dispatched, the previous action with type 'A' need to be interrupted.
    let lastWorkUnit;

    function dispatch(payload) {
      if (!util.isDiscrete() && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter called 'discrete' of 'createSource'.
          The current type is ${type}.
        `);
      }
      if (lastWorkUnit && util.isDiscrete()) {
        lastWorkUnit.interrupt();
      }
      let workUnit = sm.createWorkUnit();
      lastWorkUnit = workUnit;

      let action = {
        type,
        payload
      }
      workUnit.startWork(action);
      processor(action, (datasource) => workUnit.endWork(datasource, action));
    }
    // Bind hooks:

    // Hooks for 'start':
    // system
    sm.hook(
      "start",
      () => {
        waiting = true;
        if (discrete) {
          waiting = false;
        }
      },
      HOOK_ORDER_MAP["start"].system
    );
    // observers' hooks
    filterNullValues(observers[0]).forEach((fn, i) => unloaders[0][i][type] = sm.hook("start", fn, HOOK_ORDER_MAP["start"].observer))

    // Binds Hooks for 'end'
    // system hook
    sm.hook(
      'end',
      () => {
        if (!discrete) {
          waiting = false;
        }
      },
      HOOK_ORDER_MAP["end"].system
    );
    // observers' hooks
    filterNullValues(observers[1]).forEach((fn, i) => unloaders[1][i][type] = sm.hook("end", fn, HOOK_ORDER_MAP["end"].observer));

    // Bind Hooks for 'interrupt'
    sm.hook(
      "interrupt",
      () => waiting = false,
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

  /**
   * Grammar sugar
   * @param {Action} action 
   */
  function dispatch(action) {
    verifyShape(action, ['type'], 'The action');
    let dispatch;
    if (util.hasType(action.type)) {
      dispatch = getDispatch(action.type)
    } else {
      dispatch = createDispatch(action.type);
    }
    dispatch(action.payload);
    return dispatch;
  }

  function replaceDispatch(type, dispatch) {
    let index = groups.findIndex((group) => group[0] === type);
    if (index < 0) {
      console.warn(`Replacement failed, doesn't exist the type: ${type}.`);
      return;
    }
    if (_typeof(dispatch) !== 'function') {
      throw new Error(`Expected the dispatch as function. Instead, received: ${_typeof(dispatch)}`);
    }
    groups[index][2] = dispatch;
  }

  return {
    ...util,
    observe,
    interrupt,
    createDispatch,
    replaceDispatch,
    createDispatches,
    dispatch,
    reset: () => console.log(`No effect, the 'reset' api has deprecated.`)
  }
}