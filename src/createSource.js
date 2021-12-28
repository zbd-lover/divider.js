import _typeof from "./util/typeof";
import createInspector from "./inspector";
import creatStateMachine, { validateTag } from "./statemachine";

/**
 * @param {Processor} process is consist of all relative operations of data.
 * @param {Boolean} discrete decides the relative ops is 'discrete' or 'sequence'.
 * @returns {Source}
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

  // The observers behavior look likes midddlware.
  // starting and ending of any dispatch can be observed.
  // observers[0] -> starting
  // observers[1] -> ending
  const observers = [[], []];

  /**
   * Observe dispatch.
   * @param {string} type  whom we observe
   * @param {Tag} tag observing time
   * @param {HookForE | HookForS} fn what something we want to do, if the type is observed.
   */
  function observe(type, tag, fn) {
    // Function signature looks like observe(tag, fn).
    if (_typeof(tag) === 'function' && _typeof(type) !== 'undefined' && _typeof(fn) === 'undefined') {
      let index = validateTag(type);
      observers[index].push(tag)
      return;
    }

    const couple = dispatchMapSM.find((couple) => couple[0] === type);
    if (couple) {
      let index = validateTag(tag);
      couple[1].hook(tag, fn, index === 0 ? 2 : 1);
      return;
    }

    console.warn(`Doesn't exist hook for the dispatch with type: ${type}.`);
  }

  // It's used to do index state machie by the type.
  // Inspector uses it to want know who is processing, too.
  let uid = 0;

  /**
   * Create a dispatch and  for task you want.
   * We need 'pre-create' the each dispatch with the 'type', then, just use these dispatchs.
   * @param {string} type Describes what is the action.
   * @returns {Dispatch<T>} Function A that dispatchs action to your processor.
   * if the type specified as string, parameter called action of the dispatch always own 'type' key with the string
   */
  function createDispatch(type) {
    if (_typeof(type) !== 'string' || !type) {
      throw new Error(`
        Expected the type as a string and not empty.
        Instead, type received${_typeof(type)}, value received:${type}
      `);
    }

    // 将状态机的钩子函数分为三个部分，以实现优先级
    const sm = creatStateMachine(3);
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
    observers[1].forEach((fn) => sm.hook(1, fn, 0));

    const createNotify = (action) => (datasource) => sm.endWork(datasource, action);

    let _action = {
      type,
    }

    // system hook
    sm.hook(
      'before',
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
    observers[0].forEach((fn) => sm.hook(0, fn, 1));

    const dispatch = (action) => {
      if (!discrete && waiting) {
        throw new Error(`
          Can\'t dispatch action while sequence source is being processed,
          if 'discrete dispatch' is expected, pass 'true' to parameter
          called 'discrete' of 'createSource'.
        `);
      }
      _action = {
        type,
        payload: action
      }
      sm.startWork(_action);
      process(_action, createNotify(_action));
    }

    dispatchMapSM.push([type, sm]);

    return dispatch;
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
    createDispatch,
  }
}

export default createSource;