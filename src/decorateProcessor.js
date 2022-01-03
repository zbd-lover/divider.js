import _typeof from "./util/typeof";
import filterNullValues from "./util/filterNullValues";

/**
 * Defines what types can be accepted by the processor, in advance.
 * @param {Processor} processor the processor
 * @param {Array<string>} types Expected types.
 * @returns {Processor} A decorated processor returns true or false
 * by 'action.type' automatically to express that the action will be processed or not.
 */
export default function decorateProcessor(processor, types) {
  if (_typeof(processor) !== 'function') {
    throw new Error(`Expected the processor as function. Instead, received:${_typeof(processor)}.`)
  }
  if (_typeof(types) !== 'array') {
    throw new Error(`Expected the processor as array. Instead, received:${_typeof(processor)}.`)
  }
  
  let _types = filterNullValues(types);

  return function processorDecorated(action, notify) {
    if (!_types.includes(action?.type)) {
      return false;
    }
    processor(action, notify);
    return true;
  }
}