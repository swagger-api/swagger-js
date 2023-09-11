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
// and models in Swagger-UI, which allows us to handle larger definitions.
//
// It's likely that Swagger-Client will rely entirely on lazy resolving in
// future versions.
//
// TODO: move the remarks above into project documentation
import resolve from '../resolver/index.js';
import genericResolverStrategy from '../resolver/strategies/generic/index.js';
import openApi2ResolverStrategy from '../resolver/strategies/openapi-2/index.js';
import openApi30ResolverStrategy from '../resolver/strategies/openapi-3-0/index.js';

const resolveSubtree = async (obj, path, options = {}) => {
  const {
    returnEntireTree,
    baseDoc,
    requestInterceptor,
    responseInterceptor,
    parameterMacro,
    modelPropertyMacro,
    useCircularStructures,
    strategies,
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
    strategies,
  };
  const strategy = strategies.find((strg) => strg.match(resolveOptions));
  const normalized = strategy.normalize(resolveOptions);
  const result = await resolve({
    ...resolveOptions,
    spec: normalized,
    allowMetaPatches: true,
    skipNormalization: true,
  });

  if (!returnEntireTree && Array.isArray(path) && path.length) {
    result.spec = path.reduce((acc, pathSegment) => acc?.[pathSegment], result.spec) || null;
  }

  return result;
};

export const makeResolveSubtree =
  (defaultOptions) =>
  async (obj, path, options = {}) => {
    const mergedOptions = { ...defaultOptions, ...options };
    return resolveSubtree(obj, path, mergedOptions);
  };

export default makeResolveSubtree({
  strategies: [openApi30ResolverStrategy, openApi2ResolverStrategy, genericResolverStrategy],
});
