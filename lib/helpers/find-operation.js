"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = findOperation;
var _eachOperation = _interopRequireDefault(require("./each-operation.js"));
// Will stop iterating over the operations and return the operationObj
// as soon as predicate returns true
function findOperation(spec, predicate) {
  return (0, _eachOperation.default)(spec, predicate, true) || null;
}