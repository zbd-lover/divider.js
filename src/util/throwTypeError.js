import kindOf from "./kind";

export default function throwTypeError(value, name, can, target) {
  const kind = kindOf(value);
  throw new Error(
    `Expected the ${name} ${can === "must" ? "must" : "to"} be a ${target}. Instead, received: ${kind}.`
  );
}