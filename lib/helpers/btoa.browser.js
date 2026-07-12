"use strict";

exports.__esModule = true;
exports.default = void 0;
/* eslint-disable no-undef, no-restricted-globals */

const globalObject = (() => {
  // new standardized access to the global object
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }

  // WebWorker specific access
  if (typeof self !== 'undefined') {
    return self;
  }
  return window;
})();
const {
  btoa
} = globalObject;
var _default = exports.default = btoa;