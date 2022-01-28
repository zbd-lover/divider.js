import Source from "./source";
import decorate from "./decorate";

function createSource(actionObj, discrete) {
  const source = new Source(actionObj, discrete);
  
  return {
    dispatch: (a) => source.dispatch(a),
    subscribe: (a, b, c) => source.subscribe(a, b, c),
    canWork: () => source.canWork(),
    hasTask: (a) => source.hasTask(a),
    getCurrentTaskNames: () => source.getCurrentTaskNames(),
    isDiscrete: () => source.isDiscrete(),
    setErrorHandler: (a) => source.setErrorHandler(a),
  }
}

export {
  createSource,
  decorate
}