import _typeof from "./typeof";

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Whether a object own all specified properties at least.
 * @param {object} obj 
 * @param {Array<String>} keys 
 */
export default function verifyShape(obj, keys, host) {
  if (_typeof(obj) === 'object') {
    if (keys.some((key) => !hasOwn.call(obj, key))) {
      throw new Error(`Expected the ${host || 'obj'} must own keys: ${keys.join(' ')}`);
    }
    return;
  }
  console.warn(`Expected the object as object. Instead, received: ${_typeof(obj)}`);
}