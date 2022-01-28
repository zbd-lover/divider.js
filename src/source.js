import { isUndef } from "./util/kind";
import throwTypeError from "./util/throwTypeError";
import filterObj from "./util/filterObj";
import WorkUnit from "./work-unit";
import isPlainObject from "./util/isPlainObject";

export default class Source {
  constructor(actionObj, discrete) {
    this.discrete = !!discrete;
    this.errorHandler = null;
    this.cleanActionObj = {};
    this.validWorks = [];
    this.workUnits = [];
    this.init(actionObj);
  }

  init(actionObj) {
    if (!isPlainObject(actionObj)) {
      throwTypeError(actionObj, "'action-object'", "must", "plain object");
    }
    this.cleanActionObj = filterObj(actionObj, "function");
    this.validWorks = Object.keys(this.cleanActionObj);
    this.workUnits = this.validWorks.map((name) => new WorkUnit(name));
  }

  replaceActionObj(obj) {
    if (this.isWorking()) {
      throw new Error(
        `Can't replace 'action-object' while source working.`
      );
    }
    this.init(obj);
  }

  isDiscrete() {
    return this.discrete;
  }

  isWorking() {
    return this.workUnits.some((wu) => wu.isWorking());
  }

  canWork() {
    return this.discrete ? true : !this.isWorking();
  }

  hasTask(name) {
    if (typeof name !== 'string') {
      return false;
    }
    return !isUndef(this.cleanActionObj[name])
  }

  getTask(name) {
    return this.cleanActionObj[name];
  }

  getWorkUnit(name) {
    return this.workUnits.find((wu) => wu.name === name);
  }

  getCurrentTaskNames() {
    const names = this.workUnits
      .filter((wu) => wu.isWorking())
      .map((wu) => wu.name);
    return names;
  }

  subscribe(name, tag, fn) {
    if (this.isWorking()) {
      throw new Error(`
        Can't subscribe source while working.`
      );
    }

    let position, targetWorkUnits, _tag = tag, _fn = fn;
    // This function signature means to subscribe each tasks.
    if (typeof tag === "function" && !isUndef(name)) {
      _fn = tag;
      _tag = name;
      position = 0;
      targetWorkUnits = this.workUnits;
    } else {
      if (!this.hasTask(name)) {
        console.warn(`Cant't subscribe undefined task named ${name}.`)
        return;
      }
      // to subscribe a specified task.
      targetWorkUnits = [this.getWorkUnit(name)];
      position = 1;
    }

    const unHooks = targetWorkUnits.map((wu) => wu.hook(_tag, _fn, position));
    return () => unHooks.forEach((unHook) => unHook());
  }

  setErrorHandler(handler) {
    if (typeof handler !== "function") {
      throwTypeError(handler, "handler", "expect", "function");
    }
    this.errorHandler = handler;
  }

  dispatch(action) {
    if (!isPlainObject(action)) {
      throwTypeError(action, "action", "must", "plain object");
    }

    if (typeof action.type !== 'string') {
      throwTypeError(action.type, "action.type", "expect", "string");
    }

    const nextName = action.type;
    if (!this.hasTask(nextName)) {
      throw new Error(`Unknown task: ${nextName}.`);
    }
    if (!this.canWork()) {
      const currName = this.getCurrentWorkName();
      throw new Error(`
        Can't do task named ${currName}.
        In sequence (not discrete) mode, each task only do one by one,
        the current task named ${nextName}.`
      );
    }

    const workUnit = this.getWorkUnit(nextName);
    workUnit.start(action);

    // Notify is called in custom task function manually.
    let notify = (response) => workUnit.end(response, action)
    const task = this.getTask(nextName);

    try {
      task(action, (response) => notify && notify(response, action));
    } catch (e) {
      const { type, ...rest } = action;
      notify = null;
      workUnit.interrupt();
      if (this.errorHandler) {
        this.errorHandler({ error: e, action })
      } else {
        console.log(`Catch error in task named ${type}: `)
        console.log(e);
        console.log(`the attached payload is: `);
        console.log({ ...rest });
      }
    }
  }
}