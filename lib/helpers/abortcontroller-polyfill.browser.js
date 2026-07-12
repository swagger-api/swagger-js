"use strict";

var _abortcontrollerPonyfillBrowser = require("./abortcontroller-ponyfill.browser.js");
if (typeof globalThis.AbortController === 'undefined') {
  globalThis.AbortController = _abortcontrollerPonyfillBrowser.AbortController;
}
if (typeof globalThis.AbortSignal === 'undefined') {
  globalThis.AbortSignal = _abortcontrollerPonyfillBrowser.AbortSignal;
}