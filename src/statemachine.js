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
    return couple[0][1];
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
      Invalid tag.Expected: "before", "0", 0, "after", "1", 1. Instead, receive: ${tag}
    `)
  }
  return index;
}

/**
 * Creates a state machine when a action is dispatched.
 * Each task should own respective state machine,
 * so we can be able to observe status of each task.
 * @returns {StateMachine} hook, start and end, they are functions.
 * start and end is used for marking processor's status.
 * hook let's do something before processor works or after worked
 */

export default function creatStateMachine(number = 3) {
  const hooks = [[], []];
  const processing = false;
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