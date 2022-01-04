/**
 * Logs text conditionally
 * @param {Boolean} condition 
 * @returns Function
 */
export default function createLog(condition) {
  if (condition) {
    return (text) => text;
  }
  return (text) => console.log(text);
}