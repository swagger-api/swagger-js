"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
exports.__esModule = true;
exports.makeResolve = exports.default = void 0;
var _index = require("./utils/index.js");
var optionsUtil = _interopRequireWildcard(require("./utils/options.js"));
var _index2 = _interopRequireDefault(require("./strategies/generic/index.js"));
var _index3 = _interopRequireDefault(require("./strategies/openapi-2/index.js"));
var _index4 = _interopRequireDefault(require("./strategies/openapi-3-0/index.js"));
const resolve = async options => {
  const {
    spec,
    requestInterceptor,
    responseInterceptor
  } = options;
  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const retrievedSpec = spec || (await (0, _index.makeFetchJSON)(httpClient, {
    requestInterceptor,
    responseInterceptor
  })(retrievalURI));
  const strategyOptions = {
    ...options,
    spec: retrievedSpec
  };
  const strategy = options.strategies.find(strg => strg.match(retrievedSpec));
  return strategy.resolve(strategyOptions);
};
const makeResolve = defaultOptions => async options => {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  };
  return resolve(mergedOptions);
};
exports.makeResolve = makeResolve;
var _default = exports.default = makeResolve({
  strategies: [_index4.default, _index3.default, _index2.default]
});