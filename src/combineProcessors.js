import probe from "./util/probe";
import _typeof from "./util/typeof";

// Dispatches action to each processor from left to right.
export default function combineProcessors(...processors) {
  let currentProcessors = processors.filter((processor, index) => probe(processor, `processor${index + 1}`));

  if (processors.length !== currentProcessors.length) {
    console.warn(`
      Processors must be a array of function, the number of non function is ${processors.length - currentProcessors.length}.`
    );
  }

  if (currentProcessors.length === 0) {
    console.warn(`The final processor is 'emtpy', the number of current processors is empty.`)
    console.warn(`The final function:`)
    console.warn(`
      function emptyP(action, notify) {
        notify(action, action);
        return true;
      }
    `)
    return function emptyP(action, notify) {
      notify(action, action);
      return true;
    }
  }

  return function finalProcessor(action, notify) {
    for (let i = 0; i < currentProcessors.length; i++) {
      // The action has been processed.
      if (currentProcessors[i](action, notify)) {
        break;
      }
    }
  }
}