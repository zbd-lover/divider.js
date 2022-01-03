import _typeof from "./util/typeof"

/**
 * @param {Source} source target
 * @param  {...MiddleWare} middlewares 
 * @returns {Source}
 * Note: 
 * Constructing of each middleware is from right to left, but decorating code of `createDispatch` runs from left to right.
 * This means that first middleware is constructed end, 
 * but its decorating code for the createDispatch is called at first,
 * when final createDispatch (after applied middlewares) is called.
 */
export default function applyMiddleware(source, ...middlewares) {
  let currentMiddlewares = middlewares.filter((middleware) => _typeof(middleware) === 'function')

  if (middlewares.length > currentMiddlewares.length) {
    console.warn(`Each middleware must be a function, the number of non functions is ${middlewares.length - currentMiddlewares.length}`);
  }

  let hasConstructed = false;

  let dispatchRefs = {
    invalid: {},
    valid: {},
  };

  let initialCreateDispatch = (type) => {
    const dispatch = source.createDispatch(type);
    dispatchRefs.invalid[type] = (...args) => {
      throw new Error(`Can't called dispatch when middleware is constructing`);
    }
    dispatchRefs.valid[type] = dispatch;
    return (payload) => dispatchRefs[`${hasConstructed ? 'valid' : 'invalid'}`][type](payload);
  }

  let util = {
    isWaiting: () => source.isWaiting(),
    hasType: (type) => source.hasType(type),
    isDiscrete: () => source.isDiscrete(),
    // We usually call it.
    observe: (type, tag, fn) => source.observe(type, tag, fn)
  }

  let middlewareAPI = {
    // We usually will decorate it.
    createDispatch: initialCreateDispatch,
    // Function 'createDispatches' is decorated by system automatically, so use it directly.
    // Tools, only be used.
    ...util,
  }

  let createDispatch = currentMiddlewares.reverse().reduce(
    (latestCreateDispatch, middleware, index) => {
      if (_typeof(latestCreateDispatch) !== 'function') {
        throw new Error(`
          The middleware ${currentMiddlewares.length - index} is invalid,
          middleware must return a function that decorates 'createDispatch' by it.
        `);
      }
      
      let latestCreateDispatches = (...types) => types.map((type) => latestCreateDispatch(type));
      let nextLatestCreateDispatch = middleware({
        ...middlewareAPI,
        createDispatch: latestCreateDispatch,
        createDispatches: latestCreateDispatches
      });
      return nextLatestCreateDispatch;
    },
    initialCreateDispatch
  );

  hasConstructed = true;

  return {
    ...source,
    createDispatch,
  }
}