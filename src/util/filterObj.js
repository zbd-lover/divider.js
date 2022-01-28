import kindOf from "./kind";
import throwTypeError from "./throwTypeError";

export default function filterObj(obj, type = "string") {
  if (typeof obj !== "object") {
    throwTypeError(obj, "obj", "must", "object")
  }
  if (typeof type !== "string") {
    throwTypeError(type, "type", "must", "string");
  }
  const keys = Object.keys(obj);

  return keys.reduce(
    (accm, key) => {
      const val = obj[key];
      if (!type || kindOf(val) === type) {
        accm[key] = obj[key];
        return accm;
      }
    },
    {}
  );
}