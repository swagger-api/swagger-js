"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.serializeHeaders = serializeHeaders;
exports.serializeResponse = serializeResponse;
exports.shouldDownloadAsText = void 0;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
var _jsYaml = _interopRequireDefault(require("js-yaml"));
const shouldDownloadAsText = (contentType = '') => /(json|xml|yaml|text)\b/.test(contentType);
exports.shouldDownloadAsText = shouldDownloadAsText;
function parseBody(body, contentType) {
  if (contentType) {
    if (contentType.indexOf('application/json') === 0 || contentType.indexOf('+json') > 0) {
      return JSON.parse(body);
    }
    if (contentType.indexOf('application/xml') === 0 || contentType.indexOf('+xml') > 0) {
      return body;
    }
  }
  return _jsYaml.default.load(body);
}
function serializeHeaderValue(value) {
  const isMulti = (0, _includes.default)(value).call(value, ', ');
  return isMulti ? value.split(', ') : value;
}

// Serialize headers into a hash, where mutliple-headers result in an array.
//
// eg: Cookie: one
//     Cookie: two
//  =  { Cookie: [ "one", "two" ]
function serializeHeaders(headers = {}) {
  if (typeof headers.entries !== 'function') return {};
  return Array.from(headers.entries()).reduce((acc, [header, value]) => {
    acc[header] = serializeHeaderValue(value);
    return acc;
  }, {});
}

// Serialize the response, returns a promise with headers and the body part of the hash
function serializeResponse(oriRes, url, {
  loadSpec = false
} = {}) {
  const res = {
    ok: oriRes.ok,
    url: oriRes.url || url,
    status: oriRes.status,
    statusText: oriRes.statusText,
    headers: serializeHeaders(oriRes.headers)
  };
  const contentType = res.headers['content-type'];
  const useText = loadSpec || shouldDownloadAsText(contentType);
  const getBody = useText ? oriRes.text : oriRes.blob || oriRes.buffer;
  return getBody.call(oriRes).then(body => {
    res.text = body;
    res.data = body;
    if (useText) {
      try {
        const obj = parseBody(body, contentType);
        res.body = obj;
        res.obj = obj;
      } catch (e) {
        res.parseError = e;
      }
    }
    return res;
  });
}