import _typeof from "./typeof";

/**
 * @param {Array<any>} arr 
 * @returns Array<any>
 */
export default function filterNullValues(arr) {
  if (_typeof(arr) !== 'array') {
    return [];
  }
  return arr.filter((item) => !!item);
}