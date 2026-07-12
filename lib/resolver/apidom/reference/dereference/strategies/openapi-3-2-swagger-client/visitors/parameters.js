"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _toPath = _interopRequireDefault(require("../utils/to-path.js"));
class ParameterMacroVisitor {
  parameterMacro;
  options;
  #macroOperation;
  OperationElement = {
    enter: operationElement => {
      this.#macroOperation = operationElement;
    },
    leave: () => {
      this.#macroOperation = undefined;
    }
  };
  ParameterElement = {
    leave: (parameterElement, key, parent, path, ancestors) => {
      const pojoOperation = this.#macroOperation ? (0, _apidomCore.toValue)(this.#macroOperation) : null;
      const pojoParameter = (0, _apidomCore.toValue)(parameterElement);
      try {
        const macroValue = this.parameterMacro(pojoOperation, pojoParameter);
        parameterElement.set('default', macroValue);
      } catch (error) {
        const macroError = new Error(error, {
          cause: error
        });
        macroError.fullPath = (0, _toPath.default)([...ancestors, parent]);
        this.options.dereference.dereferenceOpts?.errors?.push?.(macroError);
      }
    }
  };
  constructor({
    parameterMacro,
    options
  }) {
    this.parameterMacro = parameterMacro;
    this.options = options;
  }
}
var _default = exports.default = ParameterMacroVisitor;