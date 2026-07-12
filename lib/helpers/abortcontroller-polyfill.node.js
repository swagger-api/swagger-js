"use strict";

var _abortcontrollerPonyfillNode = require("./abortcontroller-ponyfill.node.js");
if (typeof globalThis.AbortController === 'undefined') {
  globalThis.AbortController = _abortcontrollerPonyfillNode.AbortController;
}
if (typeof globalThis.AbortSignal === 'undefined') {
  globalThis.AbortSignal = _abortcontrollerPonyfillNode.AbortSignal;
}