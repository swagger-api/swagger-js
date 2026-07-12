"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.retrievalURI = exports.httpClient = void 0;
var _index = _interopRequireDefault(require("../../http/index.js"));
const retrievalURI = options => {
  /**
   * Swagger-UI uses baseDoc instead of url, this helper function exists
   * to allow both.
   *
   * In browser environment, we allow to pass a relative URI Reference,
   * and we resolve it against the document's baseURI before passing it deeper
   * to swagger-client code.
   */
  const {
    baseDoc,
    url
  } = options;
  const retrievalURL = baseDoc ?? url ?? '';
  return typeof globalThis.document?.baseURI === 'string' ? String(new URL(retrievalURL, globalThis.document.baseURI)) : retrievalURL;
};
exports.retrievalURI = retrievalURI;
const httpClient = options => {
  const {
    fetch,
    http
  } = options;

  // @TODO fetch should be removed, and http used instead
  // provide a default fetch implementation
  return fetch || http || _index.default;
};
exports.httpClient = httpClient;