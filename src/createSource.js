import delay from "./util/delay";
import extend from "./util/extend";
import compareAndRun from "./util/compareAndRun";

function createSource(process, discrete) {
  let currentListeners = [];
  let nextListeners = [];
  let currentStatus = null;

  function addActionListener(type, listener) {
    if (typeof type !== "string") {
      throw new Error(`type expects a string, but received: ${typeof type}`);
    }
    nextListeners.push({
      target: type,
      callback: listener,
    });

    return () => {
      let index = nextListeners.indexOf(listener);
      if (index >= 0) {
        nextListeners.splice(index, 1);
      }
    };
  }

  function decorateListener(listener, callback) {
    return (datasource, action) => {
      listener.callback(datasource, action);
      callback();
    };
  }

  function makeDispatch(action, description) {
    const status = extend({ processing: false }, description);

    const startProcess = (fn) => {
      status.processing = true;
      fn();
    };

    const endProcess = () => {
      status.processing = false;
      if (currentStatus === status) {
        currentStatus = null;
      }
    };

    const notify = (datasource) => {
      currentListeners = nextListeners.filter(
        (listener) => listener.target === action.type
      );
      const len = currentListeners.length;
      currentListeners = currentListeners.map((listener, index) =>
        discrete
          ? decorateListener(listener, () => {})
          : decorateListener(
              listener,
              delay(() => compareAndRun(index, len - 1, endProcess))
            )
      );

      try {
        currentListeners.forEach((listener) => listener(datasource, action));
      } catch (e) {
        console.log(e);
      }
    };

    return () => {
      if (!discrete && currentStatus === status) {
        throw new Error(`
          Can\'t dispatch action while synchronous source is being processed,
          if 'discrete dispatching' is expected, pass 'true' to parameter called 'discrete' of function 'createSource'.
        `);
      }
      currentStatus = status;
      startProcess(() => process(action, notify));
      if (discrete) {
        endProcess();
      }
      return status;
    };
  }

  function dispatch(action, description) {
    return makeDispatch(action, description)();
  }

  return {
    dispatch,
    makeDispatch,
    addActionListener,
  };
}

export default createSource;
