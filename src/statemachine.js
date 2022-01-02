import _typeof from "./util/typeof";

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
 * map:
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1].
  ["interrupt", 2]
  ["2", 2]
  [2, 2]
  Matchs value by tag
  if none, throw error.
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

function flat(hooks) {
  return hooks.reduce((a, b) => a.concat(b), [])
}

/**
 * Creates a state machine when a action is dispatched.
 * Each action should own respective state machine,
 * so we can be able to observe status of each task.
 * @param {string} target user
 * @returns {StateMachine} 
 * hook, startWork and endWork, they are functions.
 * The startWork and endWork is used for marking state machine's status.
 * The hook let's do something before state machine works or after worked.
 */
export default function creatStateMachine(target) {
  // 0 -> before, 1 -> after 2 -> interrupt
  let hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  let name = target;
  let processing = false;
  let interrupted = false;

  function hook(tag, fn, pos) {
    let index = validateTag(tag);
    if (_typeof(fn) !== 'function') {
      throw new Error(`
        Expected the fn as a function. Instead, received: ${_typeof(fn)}.
      `);
    }
    let len = hooksMap[index][pos].length;
    hooksMap[index][pos].push(fn);
    let released = false;
    return () => {
      if (!released && hooksMap[index][pos].length >= len) {
        released = true;
        hooksMap[index][pos][len] = () => { };
      }
    }
  }

  // reset status
  function tryWork() {
    if (interrupted) {
      interrupted = false;
      processing = false;
      return false;
    }
    return true
  }

  function startWork(action) {
    // reset status 
    if (interrupted) {
      return;
    }
    if (processing) {
      throw new Error(`SM named ${name} has started work!`);
    }
    flat(hooksMap[0]).forEach((hook) => hook(action));
    processing = true;
  }

  function endWork(datasource, action) {
    // not only resets status, and also skips the 'endwork'.
    if (!tryWork()) return;
    if (!processing) {
      throw new Error(`SM named ${name} has ended work!`);
    }
    processing = false;
    flat(hooksMap[1]).forEach((hook) => hook(datasource, action));
  }

  function interrupt() {
    if (!processing) {
      console.warn(`State Machine can be interrupted only after working or before ended.`);
      return;
    }
    interrupted = true;
    flat(hooksMap[2]).forEach((hook) => hook(name));
  }

  function reset() {
    processing = false;
    interrupted = false;
    hooksMap = [[[], [], []], [[], [], []], [[], [], []]];
  }

  return {
    hook,
    reset,
    interrupt,
    startWork,
    endWork
  };
}