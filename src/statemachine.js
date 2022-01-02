import _typeof from "./util/typeof";

const indexMap = [
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1],
  ["create", 2],
  ["2", 2],
  [2, 2],
  ["3", 3],
  [3, 3],
  ["interrupt", 3]
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
  ["create", 2]
  ["2", 2]
  [2, 2]
  Matchs value by tag
  if none, throw error.
 * @param {"before" | 0 | "0" | "after" | "1" | 1 | "create" | "2" | 2 | "interrupt" | "3" | 3} tag as index
 * @returns {number} indexed value
 */
export function validateTag(tag) {
  let index = transformIndex(tag);
  if (_typeof(index) === 'undefined') {
    throw new Error(`
      Invalid tag, expected:
      "before", "0", 0, "after", "1", 1, "create", "2", 2, "interrupt", "3", 3.
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
 * @param {number} number
 * We can add hook into pos 0 or pos 1, hooks of pos 0 always called before hooks of pos 1.
 * So wen can ensure priority of each hook.
 * If the number is 2, the number of kind of hook priority is 2.
 * @returns {StateMachine} 
 * hook, startWork and endWork, they are functions.
 * The startWork and endWork is used for marking state machine's status.
 * The hook let's do something before state machine works or after worked.
 */
export default function creatStateMachine(target, number, effect) {
  // 0 -> before, 1 -> after 2 -> create 3 -> interrupt
  let hooksMap = [[], [], [], []];
  let name = target;
  let processing = false;
  let interrupted = false;

  function init() {
    hooksMap = [[], [], [], []];
    for (let i = 1; i <= number; i++) {
      hooksMap.forEach((hooks) => hooks.push([]));
    }
  }

  init();

  function hook(tag, fn, pos) {
    const index = validateTag(tag);
    if (_typeof(fn) !== 'function') {
      throw new Error(`
        Expected the fn as a function. Instead, received: ${_typeof(fn)}.
      `);
    }
    hooksMap[index][pos].push(fn);
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
    tryWork();
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
    flat(hooksMap[3]).forEach((hook) => hook(name));
  }

  function reset() {
    init();
    processing = false;
    interrupted = false;
  }

  const sm = {
    hook,
    reset,
    interrupt,
    startWork,
    endWork
  }

  effect(sm);
  flat(hooksMap[2]).forEach((hook) => hook(name));
  return sm;
}