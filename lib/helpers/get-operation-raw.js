"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = getOperationRaw;
var _findOperation = _interopRequireDefault(require("./find-operation.js"));
var _opId = _interopRequireDefault(require("./op-id.js"));
var _legacy = _interopRequireDefault(require("./id-from-path-method/legacy.js"));
function getOperationRaw(spec, id) {
  if (!spec || !spec.paths) {
    return null;
  }
  return (0, _findOperation.default)(spec, ({
    pathName,
    method,
    operation
  }) => {
    if (!operation || typeof operation !== 'object') {
      return false;
    }
    const rawOperationId = operation.operationId; // straight from the source
    const operationId = (0, _opId.default)(operation, pathName, method);
    const legacyOperationId = (0, _legacy.default)(pathName, method);
    return [operationId, legacyOperationId, rawOperationId].some(val => val && val === id);
  });
}