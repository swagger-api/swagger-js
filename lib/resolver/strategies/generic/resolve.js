"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
exports.__esModule = true;
exports.default = resolveGenericStrategy;
var _index = _interopRequireWildcard(require("../../specmap/index.js"));
var _index2 = require("../../utils/index.js");
var optionsUtil = _interopRequireWildcard(require("../../utils/options.js"));
async function resolveGenericStrategy(options) {
  const {
    spec,
    mode,
    allowMetaPatches = true,
    pathDiscriminator,
    modelPropertyMacro,
    parameterMacro,
    requestInterceptor,
    responseInterceptor,
    skipNormalization = false,
    useCircularStructures,
    strategies
  } = options;
  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const strategy = strategies.find(strg => strg.match(spec));
  return doResolve(spec);
  async function doResolve(_spec) {
    if (retrievalURI) {
      _index.plugins.refs.docCache[retrievalURI] = _spec;
    }

    // Build a json-fetcher ( ie: give it a URL and get json out )
    _index.plugins.refs.fetchJSON = (0, _index2.makeFetchJSON)(httpClient, {
      requestInterceptor,
      responseInterceptor
    });
    const plugs = [_index.plugins.refs];
    if (typeof parameterMacro === 'function') {
      plugs.push(_index.plugins.parameters);
    }
    if (typeof modelPropertyMacro === 'function') {
      plugs.push(_index.plugins.properties);
    }
    if (mode !== 'strict') {
      plugs.push(_index.plugins.allOf);
    }

    // mapSpec is where the hard work happens
    const result = await (0, _index.default)({
      spec: _spec,
      context: {
        baseDoc: retrievalURI
      },
      plugins: plugs,
      allowMetaPatches,
      // allows adding .meta patches, which include adding `$$ref`s to the spec
      pathDiscriminator,
      // for lazy resolution
      parameterMacro,
      modelPropertyMacro,
      useCircularStructures
    });
    if (!skipNormalization) {
      result.spec = strategy.normalize(result.spec);
    }
    return result;
  }
}