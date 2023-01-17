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
import get from 'lodash/get';

import { isOpenAPI31 } from '../helpers/openapi-predicates.js';
import resolve from '../resolver/index.js';
import normalizeOpenAPI2__30 from '../helpers/normalize/openapi-2--3-0.js'; // eslint-disable-line camelcase
import normalizeOpenAPI31, { pojoAdapter } from '../helpers/normalize/openapi-3-1.js';

export default async function resolveSubtree(obj, path, opts = {}) {
  const {
    returnEntireTree,
    baseDoc,
    requestInterceptor,
    responseInterceptor,
    parameterMacro,
    modelPropertyMacro,
    useCircularStructures,
  } = opts;

  const resolveOptions = {
    pathDiscriminator: path,
    baseDoc,
    requestInterceptor,
    responseInterceptor,
    parameterMacro,
    modelPropertyMacro,
    useCircularStructures,
  };

  let normalized;
  if (isOpenAPI31(obj)) {
    normalized = pojoAdapter(normalizeOpenAPI31)(obj);
  } else {
    ({ spec: normalized } = normalizeOpenAPI2__30({
      spec: obj,
    }));
  }

  const result = await resolve({
    ...resolveOptions,
    spec: normalized,
    allowMetaPatches: true,
    skipNormalization: true,
  });

  if (!returnEntireTree && Array.isArray(path) && path.length) {
    result.spec = get(result.spec, path) || null;
  }

  return result;
}
