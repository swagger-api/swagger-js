#### Swagger specification resolver

Resolves [JSON-References](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03) ($ref)
with the values they point to inside Swagger specification. Our API can work with 
either Swagger specification represented as [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object)
or as URL that points to the Swagger specification. 

*Note: We'll demonstrate the code examples on objects that doesn't represent Swagger specification, to keep the examples short*

##### POJO usage

```js
import SwaggerClient from 'swagger-client';

const pojoSpec = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

SwaggerClient.resolve({ spec: pojoSpec }); 
/**
 * Promise({
 *   spec: {
 *      "a": 1,
 *      "b": 1
 *   },
 *   errors: []
 * })
 */
```

##### URL usage

Provided url will be resolved as Swagger specification. The them algorithm works
recursively and resolves all `JSON-References` inside the resolved Swagger specification.

```js
import SwaggerClient from 'swagger-client';

SwaggerClient.resolve({ url: 'https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml'});
/**
 * Promise({
 *   spec: ...resolved pet store...,
 *   errors: []
 * })
 */
```

*Note*: you can provide `Swagger.resolve` both `spec` and `url` options. In that case
`spec` will be always preferred and `url` will be ignored. 

##### Errors

Resolver can also produce errors on various problems inside Swagger specification.
One of those problems can be invalid `JSON-Reference`.

```js
import SwaggerClient from 'swagger-client';

const pojoSpec = {
  a: 1,
  b: {
    $ref: 1,
  }
};

SwaggerClient.resolve({ spec: pojoSpec }); 
/**
 *  Promise({
 *   "spec": {
 *     "a": 1,
 *     "b": {
 *       "$ref": 1
 *     }
 *   },
 *   "errors": [
 *     {
 *       "message": "$ref: must be a string (JSON-Ref)",
 *       "$ref": 1,
 *       "fullPath": [
 *         "b",
 *         "$ref"
 *       ]
 *     }
 *   ]
 * })
 */
```

##### Alternate API

Along with calling `resolve` statically from a `SwaggerClient` class, resolution can
happen during `SwaggerClient` class instantiation.

**POJO usage**

```js
import SwaggerClient from 'swagger-client';

const pojoSpec = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

new SwaggerClient({ spec: pojoSpec }).then(swaggerClient => {
  swaggerClient.spec;
  swaggerClient.originalSpec;
  swaggerClient.errors;
});
```

**URL usage**

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient('https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml').then(swaggerClient => {
  swaggerClient.spec;
  swaggerClient.errors;
});
```

or 

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ url: 'https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml' }).then(swaggerClient => {
  swaggerClient.spec;
  swaggerClient.errors;
});
```

##### Options

Along with `spec` and `url`, there are other options that controls the resolution
algorithm behavior.

Option | Description 
--- | ---
`fetch` | `Function=http`. If provided this function will be used as primary HTTP fetch mechanism for resolution. The provided function muse return a `Promise`. Must be compatible with our [Fetch-like interface](https://github.com/lquixada/cross-fetch).
`http` | `Function=http`. Alias for `fetch`. The option is part of API due to compatibility reasons. 
`mode` | `String=["nostrict", "strict"]`. If `strict`, don't process `allOf` JSON-References.
`allowMetaPatches` | `Boolean=true`. Allows adding .meta patches, which include adding `$$ref`s to the spec.
`pathDiscriminator` | `Array=[]`. Example value can be e.g. `['components', 'schemas']`. This tells the resolver to only resolve all `Json-Reference` on this path and leave the rest untouched. Can be used for lazy resolution.
`modelPropertyMacro` | `Function=null`. If provided, accepts a `property` object e.g. `{type: 'integer', format: 'int64' }` and computes a default value. That computed value is then assigned into original `property` object under the key `default`; `{type: 'integer', format: 'int64', default: 1 }`
`parameterMacro` | `Function=null`. If provided, accepts a `parameter` object e.g. `{ name: 'offset', in: 'query' }` and computes a default value. That computed value is then assigned into original `parameter` object under the key `default`; `{ name: 'offset', in: 'query', default: 1 }`
`requestInterceptor` | `Function=identity`. Intercepts and possibly transform a request before it is handled.
`responseInterceptor` | `Function=identity`. Intercepts and possibly transform a response before it is  handled.
`skipNormalization` | `Boolean=false`. Normalization creates unique operationIds when explicit operationIds are duplicates, and preserve originals.
`useCircularStructures` | `Boolean=false`. Prevents circular values from being constructed, unless you specifically want that to happen. If set to `false`, just leave the references unresolved.
`baseDoc` | `String=null`. If provided in the form of `URL`, will be able to resolve circular `JSON-References`.

##### Sub-Tree resolver

When working with a large JSON Swagger specification, it's often convenient to resolve `JSON-References`
in only part of Swagger specification tree. Our sub-tree resolver does exactly that.

```js
import SwaggerClient from 'swagger-client';

const pojoSpec = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

SwaggerClient.resolveSubtree(pojoSpec, ['b']);
/**
 * Promise({
 *   spec: 1,
 *   errors: [],  
 * } 
 */
```

*Note: third argument is optional and if provided it must be of the shape of `Options`
object documented in the previous section with some options added and some removed.*

Option | Description
--- | ---
`returnEntireTree` | `Boolean=false`. If set to true, returns only resolved part of Swagger specification tree determined by `path` (second argument).
`modelPropertyMacro` | `Function=null`. If provided, accepts a `property` object e.g. `{type: 'integer', format: 'int64' }` and computes a default value. That computed value is then assigned into original `property` object under the key `default`; `{type: 'integer', format: 'int64', default: 1 }`
`parameterMacro` | `Function=null`. If provided, accepts a `parameter` object e.g. `{ name: 'offset', in: 'query' }` and computes a default value. That computed value is then assigned into original `parameter` object under the key `default`; `{ name: 'offset', in: 'query', default: 1 }`
`requestInterceptor` | `Function=identity`. Intercepts and possibly transform a request before it is handled.
`responseInterceptor` | `Function=identity`. Intercepts and possibly transform a response before it is  handled.
`useCircularStructures` | `Boolean=false`. Prevents circular values from being constructed, unless you specifically want that to happen. If set to `false`, just leave the references unresolved.
`baseDoc` | `String=null`. If provided in the form of `URL`, will be able to resolve circular `JSON-References`.

##### Cache

Resolver algorithm caches results of remotely fetched and resolved Swagger specifications
in an internal cache. 
When using long-running threads that periodically pulls a Swagger specification,
the internal cache may cause a problem. In order to avoid this problem, it is possible
to explicitly clear the internal cache before doing resolution.

```js
import SwaggerClient from 'swagger-client';

SwaggerClient.clearCache();
SwaggerClient.resolve({ url: 'https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml'}).then(swaggerClient => {
  swaggerClient.spec;
  swaggerClient.errors;
});
```  

*Note: An internal cache is only involved when doing resolution on remote URLs.*
