import isPlainObject from "./isPlainObject";

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * @param {object} obj 
 * @param {Array<String>} shape 
 */
export default function verifyShape(obj, shape, host) {
  if (isPlainObject(obj)) {
    if (shape.some((key) => !hasOwn.call(obj, key))) {
      throw new Error(`Expected the ${host || 'obj'} must own keys: ${shape.join(' ')}`);
    }
  }
}