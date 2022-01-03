import _typeof from "./typeof";

/**
 * Validate the processor whether return false when accepted 'invalid' action
 * @param {Processor} processor
 * @param {string} name as tip
 * @returns boolean
 */
export default function probe(processor, name) {
  if (_typeof(processor) !== 'function') {
    throw new Error(`Expected the processor as function. Instead, received: ${_typeof(processor)}.`);
  }
  let action = {
    type: `@dividerjs/built_in_action${Math.random()}`
  }
  if (processor(action) !== false) {
    console.warn(`If the processor hasn't matched action, must return false.`);
    if (name) {
      console.log(`The processor's name is ${name}.`)
    }
    return false;
  }
  return true;
}