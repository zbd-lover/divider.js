import Divider from "./divider";
import decorate from "./decorate";
import applyBuiltInErrHandler from "./built-in/error-handler";

function createDivider(actionObj, discrete) {
  const divider = new Divider(actionObj, discrete);

  return {
    dispatch: (a) => divider.dispatch(a),
    subscribe: (a, b, c) => divider.subscribe(a, b, c),
    canDispatch: () => divider.canDispatch(),
    hasTask: (a) => divider.hasTask(a),
    getStatus: () => divider.getStatus(),
    isDiscrete: () => divider.isDiscrete(),
    replaceActionObj: (obj) => divider.replaceActionObj(obj),
    setErrorHandler: (a) => divider.setErrorHandler(a),
  }
}

export {
  createDivider,
  decorate,
  applyBuiltInErrHandler
}