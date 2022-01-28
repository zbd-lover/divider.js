import throwTypeError from "./util/throwTypeError";

const START = "start";
const END = "end";

export default class WorkUnit {
  constructor(name) {
    this.name = name;
    // hooks[0] -> hooks of `start`
    // hooks[1] -> hooks of `end`
    // fns in hooks[0][0] is always called before fns in hooks[0][1]
    this.hooks = [[[], []], [[], []]];
    this.working = false;
    this.interrupted = false;
  }

  static isValidTag(tag) {
    return tag === START || tag === END;
  }

  static indexOfTag(tag) {
    if (!WorkUnit.isValidTag(tag)) {
      return -1;
    }
    return tag === START ? 0 : 1;
  }

  hook(tag, fn, pos) {
    if (typeof fn !== 'function') {
      throwTypeError(fn, "fn", "expect", "function");
    }
    const index = WorkUnit.indexOfTag(tag);
    if (index === -1) {
      throw new Error(
        `Expected the tag must be ${START} or ${END}, Instead, received: ${tag}.`
      );
    }
    const array = this.hooks[index][pos];
    array.push(fn);
    return () => {
      const index = array.findIndex((hook) => hook === fn);
      if (index !== -1) {
        array.splice(index, 1);
      }
    };
  }

  start(action) {
    if (this.working) {
      console.warn(`Can't start task named ${this.name}, as it's working.`);
      return;
    };
    this.interrupted = false;
    this.working = true;
    const hooks = this.hooks[0].flat();
    hooks.forEach((hook) => hook(action));
  }

  end(response, action) {
    if (!this.working && !this.interrupted) {
      console.warn(`Can't end task named ${this.name}, as it has ended works.`);
      return;
    };
    this.working = false;
    const hooks = this.hooks[1].flat();
    hooks.forEach((hook) => hook(response, action));
  }

  interrupt() {
    this.working = false;
    this.interrupted = true;
  }

  isWorking() {
    return this.working;
  }
}