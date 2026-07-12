"use strict";

exports.__esModule = true;
exports.AbortSignal = exports.AbortController = void 0;
// we're targeting browsers that already support fetch API
const {
  AbortController,
  AbortSignal
} = globalThis;
exports.AbortSignal = AbortSignal;
exports.AbortController = AbortController;