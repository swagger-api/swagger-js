"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _index = _interopRequireDefault(require("./index.js"));
var _default = exports.default = {
  key: 'parameters',
  plugin: (parameters, key, fullPath, specmap) => {
    if (Array.isArray(parameters) && parameters.length) {
      const val = Object.assign([], parameters);
      const opPath = fullPath.slice(0, -1);
      const op = {
        ..._index.default.getIn(specmap.spec, opPath)
      };
      for (let i = 0; i < parameters.length; i += 1) {
        const param = parameters[i];
        try {
          val[i].default = specmap.parameterMacro(op, param);
        } catch (e) {
          const err = new Error(e);
          err.fullPath = fullPath;
          return err;
        }
      }
      return _index.default.replace(fullPath, val);
    }
    return _index.default.replace(fullPath, parameters);
  }
};