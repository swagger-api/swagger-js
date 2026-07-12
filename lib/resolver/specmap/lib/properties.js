"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _index = _interopRequireDefault(require("./index.js"));
var _default = exports.default = {
  key: 'properties',
  plugin: (properties, key, fullPath, specmap) => {
    const val = {
      ...properties
    };

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const k in properties) {
      try {
        val[k].default = specmap.modelPropertyMacro(val[k]);
      } catch (e) {
        const err = new Error(e);
        err.fullPath = fullPath; // This is an array
        return err;
      }
    }
    const patch = _index.default.replace(fullPath, val);
    return patch;
  }
};