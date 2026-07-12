"use strict";

var _fetchPonyfillBrowser = require("./fetch-ponyfill.browser.js");
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = _fetchPonyfillBrowser.fetch;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = _fetchPonyfillBrowser.Headers;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = _fetchPonyfillBrowser.Request;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = _fetchPonyfillBrowser.Response;
}
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = _fetchPonyfillBrowser.FormData;
}
if (typeof globalThis.File === 'undefined') {
  globalThis.File = _fetchPonyfillBrowser.File;
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = _fetchPonyfillBrowser.Blob;
}