import createSource from "./createSource";

function createDivider() {
  const CURRENT_SOURCES_MAP = [];

  function _createSource_(name, processor, discrete) {
    if (!name) {
      discrete = processor;
      processor = name;
    }
    const source = createSource(processor, !!discrete);
    CURRENT_SOURCES_MAP.push([name, source]);
    return source;
  }

  return {
    createSource: _createSource_,
    CURRENT_SOURCES_MAP: CURRENT_SOURCES_MAP,
  }
}

const divider = createDivider();

export default divider;