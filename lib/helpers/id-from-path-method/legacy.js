"use strict";

exports.__esModule = true;
exports.default = idFromPathMethodLegacy;
function idFromPathMethodLegacy(pathName, method) {
  return `${method.toLowerCase()}-${pathName}`;
}