"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-1");
var _properties = _interopRequireDefault(require("./properties.js"));
var _allOf = _interopRequireDefault(require("./all-of.js"));
var _parameters = _interopRequireDefault(require("./parameters.js"));
var _dereference = _interopRequireDefault(require("./dereference.js"));
// eslint-disable-line camelcase

const mergeAllVisitorsAsync = _apidomCore.mergeAllVisitors[Symbol.for('nodejs.util.promisify.custom')];
class RootVisitor {
  constructor({
    parameterMacro,
    modelPropertyMacro,
    mode,
    options,
    ...rest
  }) {
    const visitors = [];
    visitors.push(new _dereference.default({
      ...rest,
      options
    }));
    if (typeof modelPropertyMacro === 'function') {
      visitors.push(new _properties.default({
        modelPropertyMacro,
        options
      }));
    }
    if (mode !== 'strict') {
      visitors.push(new _allOf.default({
        options
      }));
    }
    if (typeof parameterMacro === 'function') {
      visitors.push(new _parameters.default({
        parameterMacro,
        options
      }));
    }
    const mergedVisitor = mergeAllVisitorsAsync(visitors, {
      nodeTypeGetter: _apidomNsOpenapi.getNodeType
    });
    Object.assign(this, mergedVisitor);
  }
}
var _default = exports.default = RootVisitor;