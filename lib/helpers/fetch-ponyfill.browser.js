"use strict";

exports.__esModule = true;
exports.fetch = exports.Response = exports.Request = exports.Headers = exports.FormData = exports.File = exports.Blob = void 0;
// we're targeting browsers that already support fetch API
const {
  fetch,
  Response,
  Headers,
  Request,
  FormData,
  File,
  Blob
} = globalThis;
exports.Blob = Blob;
exports.File = File;
exports.FormData = FormData;
exports.Request = Request;
exports.Headers = Headers;
exports.Response = Response;
exports.fetch = fetch;