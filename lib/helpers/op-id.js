"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = opId;
var _index = _interopRequireDefault(require("./id-from-path-method/index.js"));
var _replaceSpecialCharsWithUnderscore = _interopRequireDefault(require("./replace-special-chars-with-underscore.js"));
function opId(operation, pathName, method = '', {
  v2OperationIdCompatibilityMode
} = {}) {
  if (!operation || typeof operation !== 'object') {
    return null;
  }
  const idWithoutWhitespace = (operation.operationId || '').replace(/\s/g, '');
  if (idWithoutWhitespace.length) {
    return (0, _replaceSpecialCharsWithUnderscore.default)(operation.operationId);
  }
  return (0, _index.default)(pathName, method, {
    v2OperationIdCompatibilityMode
  });
}