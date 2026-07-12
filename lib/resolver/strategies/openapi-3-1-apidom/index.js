"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _ramdaAdjunct = require("ramda-adjunct");
var _apidomCore = require("@swagger-api/apidom-core");
var _resolve = _interopRequireDefault(require("./resolve.js"));
var _normalize = _interopRequireWildcard(require("./normalize.js"));
var _openapiPredicates = require("../../../helpers/openapi-predicates.js");
const openApi31ApiDOMStrategy = {
  name: 'openapi-3-1-apidom',
  match(spec) {
    return (0, _openapiPredicates.isOpenAPI31)(spec);
  },
  normalize(spec) {
    // pre-normalization - happens only once before the first lazy dereferencing and in JavaScript context
    if (!(0, _apidomCore.isElement)(spec) && (0, _ramdaAdjunct.isPlainObject)(spec) && !spec.$$normalized) {
      const preNormalized = (0, _normalize.pojoAdapter)(_normalize.default)(spec);
      preNormalized.$$normalized = true;
      return preNormalized;
    }
    // post-normalization - happens after each dereferencing and in ApiDOM context
    if ((0, _apidomCore.isElement)(spec)) {
      return (0, _normalize.default)(spec);
    }
    return spec;
  },
  async resolve(options) {
    return (0, _resolve.default)(options);
  }
};
var _default = exports.default = openApi31ApiDOMStrategy;