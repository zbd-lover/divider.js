import createSource from "./createSource";

function createDivider() {
  const CURRENT_SOURCES = [];

  function _createSource_(name, processor, discrete) {
    const source = createSource(processor, !!discrete);
    CURRENT_SOURCES.push([name, source]);
    return source;
  }
}

export {
  createSource
}

