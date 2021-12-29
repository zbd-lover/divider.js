import _typeof from "./util/typeof";

const indexMap = [
  ["before", 0],
  [0, 0],
  ["0", 0],
  ["after", 1],
  [1, 1],
  ["1", 1]
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
  Matchs value by tag
  if none, throw error.
 * @param {"before" | 0 | "0" | "after" | "1" | 1} tag as index
 * @returns {number} indexed value
 */
export function validateTag(tag) {
  let index = transformIndex(tag);
  if (_typeof(tag) === 'undefined') {
    throw new Error(`
      Invalid tag.Expected: "before", "0", 0, "after", "1", 1. Instead, received: ${tag}
    `)
  }
  return index;
}

/**
 * Creates a state machine when a action is dispatched.
 * Each action should own respective state machine,
 * so we can be able to observe status of each task.
 * @param {number} number
 * We can add hook into pos 0 or pos 1, hooks of pos 0 always called before hooks of pos 1.
 * So wen can ensure priority of each hook.
 * If the number is 2, the number of kind of hook priority is 2.
 * @returns {StateMachine} 
 * hook, startWork and endWork, they are functions.
 * The startWork and endWork is used for marking state machine's status.
 * The hook let's do something before state machine works or after worked.
 */
export default function creatStateMachine(number) {
  // 0 -> before, 1 -> after
  const hooks = [[], []];
  let processing = false;

  for (let i = 1; i <= number; i++) {
    hooks[0].push([]);
    hooks[1].push([]);
  }

  function hook(tag, fn, pos) {
    const index = validateTag(tag);
    if (_typeof(fn) !== 'function') {
      throw new Error(`
        Expected the fn as a function. Instead, received: ${_typeof(fn)}.
      `);
    }
    hooks[index][pos].push(fn);
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

  return {
    hook,
    startWork,
    endWork
  }
}