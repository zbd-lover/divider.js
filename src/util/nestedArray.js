import _typeof from "./typeof";

/**  [a, [b, [c, d]]] -> [c, d] */
export const getFinalSecondArray = (arr) => {
  const item = arr[1];
  if (_typeof(item) === 'array') {
    return getFinalSecondArray(item);
  }
  return arr;
}

/**  [[[b, c], a], d] -> [b, c] */
export const getFinalFirstArray = (arr) => {
  const item = arr[0];
  if (_typeof(item) === 'array') {
    return getFinalFirstArray(item);
  }
  return arr;
}