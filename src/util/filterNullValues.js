import _typeof from "./typeof";

/**
 * @param {Array<T>} arr 
 * @returns Array<T>
 */
export default function filterNullValues(arr) {
  if (_typeof(arr) !== 'array') {
    return [];
  }
  return arr.filter((item) => !!item);
}