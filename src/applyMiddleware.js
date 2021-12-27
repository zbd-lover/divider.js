import extend from './util/extend';

export default function applyMiddleware(source, middlewares) {
  const _source = extend({}, source);
  _source.hook = () => {
    throw new Error(`Shouldn't called hook. Because hook oriented the specific dispatch`)
  }
  middlewares.forEach((middleware) => middleware(_source));
}