"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = exports.clearCache = void 0;
var _resolve = _interopRequireDefault(require("./resolve.js"));
var _normalize = _interopRequireDefault(require("./normalize.js"));
var _openapiPredicates = require("../../../helpers/openapi-predicates.js");
var _index = require("../generic/index.js");
exports.clearCache = _index.clearCache;
const openApi2Strategy = {
  name: 'openapi-2',
  match(spec) {
    return (0, _openapiPredicates.isOpenAPI2)(spec);
  },
  normalize(spec) {
    const {
      spec: normalized
    } = (0, _normalize.default)({
      spec
    });
    return normalized;
  },
  async resolve(options) {
    return (0, _resolve.default)(options);
  }
};
var _default = exports.default = openApi2Strategy;