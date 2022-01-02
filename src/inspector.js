import isPlainObject from "./util/isPlainObject";
import verifyShape from "./util/verifyShape";
import _typeof from "./util/typeof";

let forkOption = {
  enabled: [true, false],
  error: [true, false],
  interval: [1000, 1000],
  tolerance: [3, 3]
}

function extractOption(index) {
  const option = {};
  for (let key in forkOption) {
    option[key] = forkOption[key][index];
  }
  return option;
}

function getProdOption() {
  return extractOption(0);
}

function getDevOption() {
  return extractOption(1);
}

export function setInspectorOption(option) {
  if (!isPlainObject(option)) {
    throw new Error(`Expected the option must be a plain object.`);
  }
  verifyShape(
    option,
    ['enabled', 'error', 'interval', 'tolerance'],
    `inspector's option`
  );
  forkOption = option;
}

/**
 * Normally, one dispatch means one response.
 * Inspector will check Is the number of dispatch consistent with the number of response.
 * In productin environent,enabled by default, it will throw error if not.
 * In development environent,disabeld by default.
 */
export default function createInspector() {
  let option;
  try {
    option = process.env.NODE_ENV === 'production' ? getProdOption() : getDevOption();
  } catch (e) {
    option = getProdOption();
  }
  if (!option.enabled) {
    return null;
  }
  // 0 -> dispatch 1 -> response
  // [ [0, 1], [0, null], [0, 1] ]
  const couples = [];
  // to avoid making bad effect on program
  const life = 100;
  const suspects = new Array(life).fill(0);

  let timer;
  setTimeout(() => timer = setInterval(() => verifyTimes(), option.interval), 500);

  function verifyTimes() {
    if (couples.length >= life) {
      clearInterval(timer);
      return;
    }
    couples.forEach((couple, index) => {
      if (couple[0] === 0 && couple[1] !== 1) {
        suspects[index]++;
        return;
      }
      suspects[index] = 0;
    });

    if (suspects.some((suspect) => suspect >= option.tolerance) && couples.length < life) {
      const text = `
        You maybe forget to call 'notify' in 'process' function.
        It's maybe make bad effect for your 'hook for dispatch',
        or source is 'sequence', yet.
      `;
      destroy()
      if (option.error) {
        throw new Error(text);
      }
      console.warn(text);
    }
  }

  function collect(index, flag) {
    if (!couples[index]) {
      couples[index] = [];
    }
    couples[index][flag] = flag;
  }

  function destroy() {
    couples.length = 100;
  }

  return {
    collect,
    destroy
  }
}