import _typeof from "./util/typeof";
import { getFinalFirstArray, getFinalSecondArray } from "./util/nestedArray";

const indexMap = [
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1]
];

const _transformIndex = (key) => {
  const couple = indexMap.filter((item) => item[0] === key).map((item) => item[1])
  if (couple.length === 1) {
    return couple[0][1];
  }
}

/**
 * Creates a state machine when a action is dispatched.
 * Each task should own respective state machine,
 * so we can be able to observe status of each task.
 * @returns {StateMachine} hook, start and end, they are functions.
 * start and end is used for marking processor's status.
 * hook let's do something before processor works or after worked
 */

export default function creatStateMachine(observers) {
  let processing = false;
  let hooks = [[], []];

  function validate(tag) {
    let index = _transformIndex(tag);
    if (_typeof(index) === 'undefined') {
      throw new Error(`
        Invalid tag.Expected: "before", "0", 0, "after", "1", 1. Instead, receive: ${index}
      `)
    }
    return index;
  }

  function observe(tag, fn) {
    const index = validate(tag);

    if (_typeof(fn) !== 'function') {
      throw new Error(`
        Expected the fn as a function. Instead, received: ${_typeof(fn)}.
      `);
    }

    const merged = hooks[index].slice(0);
    if (index === 0) {
      hooks[index] = [fn, merged];
    } else {
      hooks[index] = [merged, fn]
    }
  }

  function hook(tag, fn) {
    let index = validate(tag);
    // hooks for "before"
    let _hooks = getFinalSecondArray(hooks[0]);
    // hooks for "after"
    let hooks_ = getFinalFirstArray(hooks[1]);

    let ftype = _typeof(fn);
    if (ftype === 'function') {
      // hook for "before"
      if (index === 0) {
        if (_hooks.length === 0) {
          // system hook's position is 0 for "before"
          _hooks[0] = fn;
        } else {
          // user's custom hook position is 1 for "before"
          _hooks[1] = fn;
        }
      }
      // hook for "after"
      if (index === 1) {
        if (hooks_.length === 0) {
          // system hook's position is 1 for "after"
          hooks_[1] = fn;
        } else {
          // user's custom hook position is 0 for "after"
          hooks_[0] = fn;
        }
      }

    } else if (ftype === 'undefined') {
      if (index === 0) {
        _hooks[1] = null;
        return;
      }
      if (index === 1) {
        hooks_[0] = null;
        return;
      }
    } else {
      throw new Error(`
        Expected the fn as a function or null or undefined. Instead, received: ${ftype}
      `);
    }
  }

  function startWork(action) {
    if (processing) {
      throw new Error(`SM has started work!`);
    }
    processing = true;
    hooks[0].flat().forEach((hook) => hook(action));
  }

  function endWork(datasource, action) {
    if (!processing) {
      throw new Error(`SM has ended work!`);
    }
    processing = false;
    hooks[1].flat().forEach((hook) => hook(datasource, action));
  }

  observers.forEach((observer) => {
    if (observer.before) {
      observe("before", observer.before);
    }
    if (observer.after) {
      observe("after", observer.after);
    }
  });

  return {
    hook,
    observe,
    startWork,
    endWork
  }
}