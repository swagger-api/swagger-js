"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.makeResolveSubtree = exports.default = void 0;
var _index = _interopRequireDefault(require("../resolver/index.js"));
var _index2 = _interopRequireDefault(require("../resolver/strategies/generic/index.js"));
var _index3 = _interopRequireDefault(require("../resolver/strategies/openapi-2/index.js"));
var _index4 = _interopRequireDefault(require("../resolver/strategies/openapi-3-0/index.js"));
var _openapiPredicates = require("../helpers/openapi-predicates.js");
// The subtree resolver is a higher-level interface that allows you to
// get the same result that you would from `Swagger.resolve`, but focuses on
// a subtree of your object.
//
// It makes several assumptions that allow you to think less about what resolve,
// specmap, and normalizeSwagger are doing: if this is not suitable for you,
// you can emulate `resolveSubtree`'s behavior by talking to the traditional
// resolver directly.
//
// By providing a top-level `obj` and a `path` to resolve within, the subtree
// at `path` will be resolved and normalized in the context of your top-level
// `obj`. You'll get the resolved subtree you're interest in as a return value
// (or, you can use `returnEntireTree` to get everything back).
//
// This is useful for cases where resolving your entire object is unnecessary
// and/or non-performant; we use this interface for lazily resolving operations
// and models in Swagger-UI, which allows us to handle larger OpenAPI descriptions.
//
// It's likely that Swagger-Client will rely entirely on lazy resolving in
// future versions.
//
// TODO: move the remarks above into project documentation

const resolveSubtree = async (obj, path, options = {}) => {
  const {
    returnEntireTree,
    baseDoc,
    requestInterceptor,
    responseInterceptor,
    parameterMacro,
    modelPropertyMacro,
    useCircularStructures,
    strategies
  } = options;
  const resolveOptions = {
    spec: obj,
    pathDiscriminator: path,
    baseDoc,
    requestInterceptor,
    responseInterceptor,
    parameterMacro,
    modelPropertyMacro,
    useCircularStructures,
    strategies
  };
  const strategy = strategies.find(strg => strg.match(obj));
  const normalized = strategy.normalize(obj);
  const result = await (0, _index.default)({
    spec: normalized,
    ...resolveOptions,
    allowMetaPatches: true,
    skipNormalization: !(0, _openapiPredicates.isOpenAPI31)(obj)
  });
  if (!returnEntireTree && Array.isArray(path) && path.length) {
    result.spec = path.reduce((acc, pathSegment) => acc?.[pathSegment], result.spec) || null;
  }
  return result;
};
const makeResolveSubtree = defaultOptions => async (obj, path, options = {}) => {
  const mergedOptions = {
    ...defaultOptions,
    ...options
  };
  return resolveSubtree(obj, path, mergedOptions);
};
exports.makeResolveSubtree = makeResolveSubtree;
var _default = exports.default = makeResolveSubtree({
  strategies: [_index4.default, _index3.default, _index2.default]
});