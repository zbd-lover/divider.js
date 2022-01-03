import _typeof from "./typeof";
import filterNullValues from "./filterNullValues";

const indexMap = [
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1],
  ["interrupt", 2],
  ["2", 2],
  [2, 2]
];

function transformIndex(key) {
  const couple = indexMap.filter((item) => item[0] === key).map((item) => item[1])
  if (couple.length === 1) {
    return couple[0];
  }
}

/**
 * Matchs value by tag if none, throw error.
 * @param {"before" | 0 | "0" | "after" | "1" | 1 | "interrupt" | "2" | 2 } tag as index
 * @returns {number} indexed value
 */
export function validateTag(tag) {
  let index = transformIndex(tag);
  if (_typeof(index) === 'undefined') {
    throw new Error(`
      Invalid tag, expected:
      "before", "0", 0, "after", "1", 1, "interrupt", "2", 2.
      Instead, received: ${tag}
    `)
  }
  return index;
}

function _flat(hooks) {
  return hooks.reduce((a, b) => a.concat(b), [])
}

/**
 * Creates a state machine when `createDispatch` is called.
 * Each 'dispatch' should own respective state machine,
 * so we can be able to observe status of each task.
 * @param {string} target user
 * @returns {StateMachine} 
 * `hook`, `reset`, `createWorkUnit`, they are functions.
 * `hook` let's do something before state machine works or after worked.
 * `createWork` unit returns `startWork`, `endWork`, and `interrupt`,
 * `startWork` and `endWork` is used for marking machine's status,
 * `interrupt`: Will not notify observers in this processing.
 */
export default function creatStateMachine(target, interactive = true) {
  // 0 -> before, 1 -> after 2 -> interrupt
  let hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  let name = target;
  let currentInterrupt;  

  function hook(tag, fn, pos) {
    let index = validateTag(tag);
    if (_typeof(fn) !== 'function') {
      throw new Error(`Expected the fn as a function. Instead, received: ${_typeof(fn)}.`);
    }
    let len = hooksMap[index][pos].length;
    hooksMap[index][pos][len] = fn;
    let released = false;
    return () => {
      if (!released && hooksMap[index][pos].length >= len) {
        released = true;
        hooksMap[index][pos][len] = null;
      }
    }
  }

  let uid = 1;

  function createWorkUnit() {
    let cuid = uid++;
    let processing;
    let interrupted = false;

    function startWork(action) {
      if (interrupted) {
        return;
      }
      if (processing) {
        throw new Error(`SM named ${name} has started work!`);
      }
      filterNullValues(_flat(hooksMap[0])).forEach((hook) => hook(action));
      processing = true;
    }

    function endWork(datasource, action) {
      if (interrupted) {
        return;
      }
      if (!processing) {
        throw new Error(`SM named ${name} has ended work!`);
      }
      processing = false;
      filterNullValues(_flat(hooksMap[1])).forEach((hook) => hook(datasource, action));
    };

    function interrupt() {
      if (interrupted && interactive) {
        console.log(`No impact of this interruption, because state machine named ${name} has interrupted, the uid: ${cuid}.`)
        return;
      }
      if (!processing && interactive) {
        if (_typeof(processing) === 'undefined') {
          console.log(`No impact of this interruption, because state machine has not worked, the uid: ${cuid}.`);
          return;
        }
        if (_typeof(processing) === 'boolean') {
          console.log(`No impact of this interruption, because state machine has worked, the uid: ${cuid}.`);
          return;
        }
        console.log(`State Machine can be interrupted only after working or before ended, the uid: ${cuid}.`);
        return;
      }

      interrupted = true;
      processing = false;
      
      filterNullValues(_flat(hooksMap[2])).forEach((hook) => hook(name));
      if (interactive) {
        console.log(`State Machine named ${name} is interrupted, the uid: ${cuid}.`);
        console.log(`---------------`);
      }
    }

    currentInterrupt = interrupt;

    return {
      startWork,
      endWork,
      interrupt
    }
  }

  return {
    hook,
    createWorkUnit,
    interrupt() {
      if (_typeof(currentInterrupt) === 'function') {
        currentInterrupt();
      }
    }
  };
}