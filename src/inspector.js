import isPlainObject from "./util/isPlainObject";
import _typeof from "./util/typeof";
import verifyShape from "./util/verifyShape";

let forkOption = {
  enabled: [true, false],
  error: [true, false],
  interval: [1500, 2000],
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

// 在生产模式下默认开启
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
  // It's used for verifing 'dispatch times' and 'response times' are matched.
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

    if (suspects.some((suspect) => suspect >= option.tolerance)) {
      const text = `
        You maybe forget to call 'notify' in 'process' function.
        It's maybe make bad effect for your 'hook for dispatch',
        or source is 'sequence', yet.
      `;
      couples.length = life;
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

  return {
    collect,
  }
}