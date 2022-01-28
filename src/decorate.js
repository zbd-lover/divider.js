import stack from "./util/stack";
import filterObj from "./util/filterObj";

export default function decorate(obj, ...fns) {
  const cleanObj = filterObj(obj, "function");
  const keys = Object.keys(cleanObj);

  const cleanFns = fns.filter((fn) => typeof fn === "function");

  return keys.reduce(
    (accm, key) => {
      // obj[key] is origin handler of task named 'key'.
      // Each decorator owns the reference to previous decorator,
      // they can skip previous decorator conditionally to do itself thing,
      // or hand args to it directly, the previous decorator repeats this.
      // A this kind decorator example:
      // let fn1 = (prev) => (...args) => args.length > 0 ? prev(...args) : null
      // Please see the /src/util/stack.js to learn about details.
      accm[key] = stack(obj[key], ...cleanFns);
      return accm;
    },
    {}
  );
}