(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.divider = {}));
})(this, (function (exports) { 'use strict';

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
  }

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};

    var target = _objectWithoutPropertiesLoose(source, excluded);

    var key, i;

    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }

    return target;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function kindOf(v) {
    var _v$constructor;

    if (v === void 0) return "undefined";
    if (v === null) return "null";

    var _type = _typeof(v);

    switch (_type) {
      case 'boolean':
      case 'function':
      case 'string':
      case 'symbol':
      case 'number':
      case 'bigint':
        return _type;
    }

    return (v === null || v === void 0 ? void 0 : (_v$constructor = v.constructor) === null || _v$constructor === void 0 ? void 0 : _v$constructor.name) || "unknown";
  }
  function isUndef(v) {
    return v === void 0 || v === null;
  }

  function throwTypeError(value, name, can, target) {
    var kind = kindOf(value);
    throw new Error("Expected the ".concat(name, " ").concat(can === "must" ? "must" : "to", " be a ").concat(target, ". Instead, received: ").concat(kind, "."));
  }

  function filterObj(obj) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "string";

    if (_typeof(obj) !== "object") {
      throwTypeError(obj, "obj", "must", "object");
    }

    if (typeof type !== "string") {
      throwTypeError(type, "type", "must", "string");
    }

    var keys = Object.keys(obj);
    return keys.reduce(function (accm, key) {
      var val = obj[key];

      if (kindOf(val) === type) {
        accm[key] = obj[key];
        return accm;
      }
    }, {});
  }

  var START = "start";
  var END = "end";
  var INTERRUPT = "ignore";

  var WorkUnit = /*#__PURE__*/function () {
    function WorkUnit(name) {
      _classCallCheck(this, WorkUnit);

      this.name = name; // hooks[0] -> hooks of `start`
      // hooks[1] -> hooks of `end`
      // hooks[1] -> hooks of ignore
      // fns in hooks[0][0] is always called before fns in hooks[0][1]

      this.hooks = [[[], []], [[], []], [[], []]];
      this.working = false;
      this.interrupted = false;
    }

    _createClass(WorkUnit, [{
      key: "hook",
      value: function hook(tag, fn, pos) {
        if (typeof fn !== 'function') {
          throwTypeError(fn, "fn", "expect", "function");
        }

        var index = WorkUnit.indexOfTag(tag);

        if (index === -1) {
          throw new Error("Expected the tag must be ".concat(START, "\u3001").concat(END, " or ").concat(INTERRUPT, ", Instead, received: ").concat(tag, "."));
        }

        var array = this.hooks[index][pos];
        array.push(fn);
        return function () {
          var index = array.findIndex(function (hook) {
            return hook === fn;
          });

          if (index !== -1) {
            array.splice(index, 1);
          }
        };
      }
    }, {
      key: "start",
      value: function start(action) {
        if (this.working) {
          console.warn("Can't start task named ".concat(this.name, ", as it's working."));
          return;
        }
        this.interrupted = false;
        this.working = true;
        var hooks = this.hooks[0].flat();
        hooks.forEach(function (hook) {
          return hook(action);
        });
      }
    }, {
      key: "end",
      value: function end(response, action) {
        if (!this.working && !this.interrupted) {
          console.warn("Can't end task named ".concat(this.name, ", as it has ended works."));
          return;
        }
        this.working = false;
        var hooks = this.hooks[1].flat();
        hooks.forEach(function (hook) {
          return hook(response, action);
        });
      }
    }, {
      key: "interrupt",
      value: function interrupt(active, action) {
        this.working = false;
        this.interrupted = true;

        if (active) {
          var hooks = this.hooks[2].flat();
          hooks.forEach(function (hook) {
            return hook(action);
          });
        }
      }
    }, {
      key: "isWorking",
      value: function isWorking() {
        return this.working;
      }
    }], [{
      key: "isValidTag",
      value: function isValidTag(tag) {
        return tag === START || tag === END || tag === INTERRUPT;
      }
    }, {
      key: "indexOfTag",
      value: function indexOfTag(tag) {
        if (!WorkUnit.isValidTag(tag)) {
          return -1;
        }

        return tag === START ? 0 : tag === END ? 1 : 2;
      }
    }]);

    return WorkUnit;
  }();

  function isPlainObject(v) {
    if (isUndef(v)) return false;
    if (_typeof(v) !== 'object') return false;
    var baseV = Object.getPrototypeOf(v);
    return baseV === Object.prototype;
  }

  var _excluded = ["type"];

  var Divider = /*#__PURE__*/function () {
    function Divider(actionObj, discrete) {
      _classCallCheck(this, Divider);

      this.discrete = !!discrete;
      this.errorHandler = null;
      this.cleanActionObj = {};
      this.validWorks = [];
      this.workUnits = [];
      this.init(actionObj);
    }

    _createClass(Divider, [{
      key: "init",
      value: function init(actionObj) {
        if (!isPlainObject(actionObj)) {
          throwTypeError(actionObj, "'action-object'", "must", "plain object");
        }

        this.cleanActionObj = filterObj(actionObj, "function");
        this.validWorks = Object.keys(this.cleanActionObj);
        this.workUnits = this.validWorks.map(function (name) {
          return new WorkUnit(name);
        });
      }
    }, {
      key: "replaceActionObj",
      value: function replaceActionObj(obj) {
        if (this.isWorking()) {
          throw new Error("Can't replace 'action-object' while working.");
        }

        this.init(obj);
      }
    }, {
      key: "isDiscrete",
      value: function isDiscrete() {
        return this.discrete;
      }
    }, {
      key: "isWorking",
      value: function isWorking() {
        return this.workUnits.some(function (wu) {
          return wu.isWorking();
        });
      }
    }, {
      key: "canDispatch",
      value: function canDispatch() {
        return this.discrete ? true : !this.isWorking();
      }
    }, {
      key: "hasTask",
      value: function hasTask(name) {
        if (typeof name !== 'string') {
          return false;
        }

        return !isUndef(this.cleanActionObj[name]);
      }
    }, {
      key: "getTask",
      value: function getTask(name) {
        return this.cleanActionObj[name];
      }
    }, {
      key: "getWorkUnit",
      value: function getWorkUnit(name) {
        return this.workUnits.find(function (wu) {
          return wu.name === name;
        });
      }
    }, {
      key: "getStatus",
      value: function getStatus() {
        var names = this.workUnits.filter(function (wu) {
          return wu.isWorking();
        }).map(function (wu) {
          return wu.name;
        });
        return names;
      }
    }, {
      key: "subscribe",
      value: function subscribe(name, tag, fn) {
        if (this.isWorking()) {
          throw new Error("\n        Can't subscribe while working.");
        }

        var position,
            targetWorkUnits,
            _tag = tag,
            _fn = fn; // This function signature means to subscribe each tasks.

        if (typeof tag === "function" && !isUndef(name)) {
          _fn = tag;
          _tag = name;
          position = 0;
          targetWorkUnits = this.workUnits;
        } else {
          if (!this.hasTask(name)) {
            console.warn("Cant't subscribe undefined task named ".concat(name, "."));
            return;
          } // to subscribe a specified task.


          targetWorkUnits = [this.getWorkUnit(name)];
          position = 1;
        }

        var unHooks = targetWorkUnits.map(function (wu) {
          return wu.hook(_tag, _fn, position);
        });
        return function () {
          return unHooks.forEach(function (unHook) {
            return unHook();
          });
        };
      }
    }, {
      key: "setErrorHandler",
      value: function setErrorHandler(handler) {
        if (typeof handler !== "function") {
          throwTypeError(handler, "handler", "expect", "function");
        }

        this.errorHandler = handler;
      }
    }, {
      key: "dispatch",
      value: function dispatch(action) {
        if (!isPlainObject(action)) {
          throwTypeError(action, "action", "must", "plain object");
        }

        if (typeof action.type !== 'string') {
          throwTypeError(action.type, "action.type", "expect", "string");
        }

        var nextName = action.type;

        if (!this.hasTask(nextName)) {
          throw new Error("Unknown task: ".concat(nextName, "."));
        }

        if (!this.canDispatch()) {
          var currName = this.getStatus();
          throw new Error("\n        Can't dispatch action, action.type is ".concat(nextName, ".\n        In sequence (not discrete) mode, we only dispatch action one by one,\n        the current working action.type is ").concat(currName, "."));
        }

        var workUnit = this.getWorkUnit(nextName); // notify is called in custom task function manually.

        var notify = function notify(response, $action) {
          return workUnit.end(response, $action);
        };

        var task = this.getTask(nextName);
        workUnit.start(action);

        try {
          task(action, function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            var response = args[0],
                _args$ = args[1],
                $action = _args$ === void 0 ? action : _args$;

            if (notify && args.length > 0) {
              notify(response, $action);
            } else if (args.length === 0) {
              workUnit.interrupt(true, $action);
            }
          });
        } catch (e) {
          var type = action.type,
              rest = _objectWithoutProperties(action, _excluded);

          notify = null;
          workUnit.interrupt(false);

          if (this.errorHandler) {
            this.errorHandler({
              error: e,
              action: action
            });
          } else {
            console.log("Catch error in task named ".concat(type, ": "));
            console.log(e);
            console.log("the attached payload is: ");
            console.log(_objectSpread2({}, rest));
          }
        }
      }
    }]);

    return Divider;
  }();

  function stack() {
    for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
      fns[_key] = arguments[_key];
    }

    if (fns.length === 0) {
      return function (fn) {
        if (typeof fn !== "function") {
          return function () {
            for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              args[_key2] = arguments[_key2];
            }

            return args;
          };
        }

        return fn;
      };
    }

    return fns.reduce(function (prev, curr) {
      return curr(prev);
    });
  } // function i(...args) {
  //   console.log(...args);
  //   console.log("run c");
  // }
  // function a(prev) {
  //   return (...args) => {
  //     // can be conditional
  //     prev(...args)
  //     console.log("run a");
  //   }
  // }
  // function b(prev) {
  //   return (...args) => {
  //     prev(...args)
  //     console.log("run b");
  //   }
  // }
  // stack(i, a, b)("stack");
  // stack
  // run c
  // run b
  // run a

  function decorate(obj) {
    var cleanObj = filterObj(obj, "function");
    var keys = Object.keys(cleanObj);

    for (var _len = arguments.length, fns = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      fns[_key - 1] = arguments[_key];
    }

    var cleanFns = fns.filter(function (fn) {
      return typeof fn === "function";
    });
    return keys.reduce(function (accm, key) {
      // obj[key] is origin handler of task named 'key'.
      // Each decorator owns the reference to the previous decorator,
      // they can skip previous decorator conditionally to do itself thing,
      // or hand args to it directly, the previous decorator repeats this.
      // A decorator example:
      // let fn = (prev) => (...args) => args.length > 0 ? prev(...args) : null
      accm[key] = stack.apply(void 0, [obj[key]].concat(_toConsumableArray(cleanFns)));
      return accm;
    }, {});
  }

  function createDivider(actionObj, discrete) {
    var divider = new Divider(actionObj, discrete);
    return {
      dispatch: function dispatch(a) {
        return divider.dispatch(a);
      },
      subscribe: function subscribe(a, b, c) {
        return divider.subscribe(a, b, c);
      },
      canDispatch: function canDispatch() {
        return divider.canDispatch();
      },
      hasTask: function hasTask(a) {
        return divider.hasTask(a);
      },
      getStatus: function getStatus() {
        return divider.getStatus();
      },
      isDiscrete: function isDiscrete() {
        return divider.isDiscrete();
      },
      setErrorHandler: function setErrorHandler(a) {
        return divider.setErrorHandler(a);
      }
    };
  }

  exports.createDivider = createDivider;
  exports.decorate = decorate;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
