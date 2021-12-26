import _typeof from "./util/typeof";

/**
 * Creates a state machine when a action is dispatched.
 * Each task should own respective state machine,
 * so we can be able to observe status of each task.
 * @returns {StateMachine} hook, start and end, they are functions.
 * start and end is used for marking processor's status.
 * hook let's do something before processor works or after worked
 */

export default function creatStateMachine() {
  let hooks = [[], []];
  let processing = false;

  function startWork() {
    if (processing) {
      throw new Error(`SM has started work!`);
    }
    processing = true;
    hooks[0].slice(0).reverse().forEach((hook) => hook());
  }

  function endWork() {
    if (!processing) {
      throw new Error(`SM has ended work!`);
    }
    processing = false;
    hooks[1].slice(0).reverse().forEach((hook) => hook())
  }

  /**
   * @param {number | string} tag 0 "after" 1 "before" hook's target
   * @param {Function} fn function do something else
   */
  function hook(tag, fn) {
    if (_typeof(tag) === 'undefined') {
      hooks = hooks.map((hook) => hook.slice(0, 1));
      return;
    }

    let index = tag;
    if (_typeof(index) !== 'number') {
      if (index === 'before') {
        index = 0;
      } else if (index === 'after') {
        index = 1;
      } else {
        throw new Error(`Invalid tag as string, valid tag is one of 'after' or'before'.`);
      }
    }

    if (index === 0 || index === 1) {
      if (_typeof(fn) === 'undefined') {
        hooks[index].splice(1,1);
      } else if (_typeof(fn) === 'function') {
        if (hooks[index].length === 2) {
          hooks[index] = fn;
        } else {
          hooks[index].push(fn);
        }
      } else {
        throw new Error(`Expected the fn as function. Instead, received: ${_typeof(fn)}.`);
      }
    } else {
      throw new Error(`Invalid tag as number, valid tag is 0 or 1.`);
    }
  }

  return {
    hook,
    startWork,
    endWork
  }
}