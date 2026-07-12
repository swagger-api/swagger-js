"use strict";

exports.__esModule = true;
exports.default = void 0;
const replaceSpecialCharsWithUnderscore = operationId => operationId.replace(/\W/gi, '_');
var _default = exports.default = replaceSpecialCharsWithUnderscore;