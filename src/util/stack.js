export default function stack(...fns) {
  if (fns.length === 0) {
    return (fn) => {
      if (typeof fn !== "function") {
        return (...args) => args;
      }
      return fn;
    };
  }
  return fns.reduce((prev, curr) => curr(prev));
}

// function i(...args) {
//   console.log(...args);
//   console.log("run c");
// }

// function a(prev) {
//   return (...args) => {
//     // can be conditional
//     prev(...args)
//     console.log("run a");
//   }
// }

// function b(prev) {
//   return (...args) => {
//     prev(...args)
//     console.log("run b");
//   }
// }

// stack(a, b)(i)("stack");

// stack
// run c
// run b
// run a