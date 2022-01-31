import { isUndef } from "./util/kind";
import throwTypeError from "./util/throwTypeError";
import filterObj from "./util/filterObj";
import WorkUnit from "./work-unit";
import isPlainObject from "./util/isPlainObject";

export default class Divider {
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
        `Can't replace 'action-object' while working.`
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

  canDispatch() {
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

  getStatus() {
    const names = this.workUnits
      .filter((wu) => wu.isWorking())
      .map((wu) => wu.name);
    return names;
  }

  subscribe(name, tag, fn) {
    if (this.isWorking()) {
      throw new Error(`
        Can't subscribe while working.`
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
    if (!this.canDispatch()) {
      const currName = this.getStatus();
      throw new Error(`
        Can't dispatch action, action.type is ${nextName}.
        In sequence (not discrete) mode, we only dispatch action one by one,
        the current working action.type is ${currName}.`
      );
    }

    const workUnit = this.getWorkUnit(nextName);
    // notify is called in custom task function manually.
    let notify = (response, $action) => workUnit.end(response, $action);
    const task = this.getTask(nextName);

    workUnit.start(action);
    try {
      task(action, (...args) => {
        const [response, $action = action] = args;
        if (notify && args.length > 0) {
          notify(response, $action);
        } else if (args.length === 0) {
          workUnit.interrupt(true, $action);
        }
      });
    } catch (e) {
      const { type, ...rest } = action;
      notify = null;
      workUnit.interrupt(false);
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