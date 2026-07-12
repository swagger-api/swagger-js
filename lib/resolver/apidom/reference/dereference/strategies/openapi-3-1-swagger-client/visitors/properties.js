"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _toPath = _interopRequireDefault(require("../utils/to-path.js"));
class ModelPropertyMacroVisitor {
  modelPropertyMacro;
  options;
  SchemaElement = {
    leave: (schemaElement, key, parent, path, ancestors) => {
      if (typeof schemaElement.properties === 'undefined') return;
      if (!(0, _apidomCore.isObjectElement)(schemaElement.properties)) return;
      schemaElement.properties.forEach(property => {
        if (!(0, _apidomCore.isObjectElement)(property)) return;
        try {
          const macroValue = this.modelPropertyMacro((0, _apidomCore.toValue)(property));
          property.set('default', macroValue);
        } catch (error) {
          const macroError = new Error(error, {
            cause: error
          });
          macroError.fullPath = [...(0, _toPath.default)([...ancestors, parent, schemaElement]), 'properties'];
          this.options.dereference.dereferenceOpts?.errors?.push?.(macroError);
        }
      });
    }
  };
  constructor({
    modelPropertyMacro,
    options
  }) {
    this.modelPropertyMacro = modelPropertyMacro;
    this.options = options;
  }
}
var _default = exports.default = ModelPropertyMacroVisitor;