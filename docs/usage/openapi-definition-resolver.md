# OpenAPI definition resolver

Resolves [JSON-References](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03) (`$ref`)
with the values they point to inside OpenAPI definition. Our API can work with 
either OpenAPI Specification represented as [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object)
or as URL that points to the OpenAPI definition file. 

> *__Note:__ We'll demonstrate the code examples on objects that doesn't represent OpenAPI Specification, to keep the examples short*

### POJO usage

```js
import SwaggerClient from 'swagger-client';

const pojoDefinition = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

SwaggerClient.resolve({ spec: pojoDefinition }); 
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

### URL usage

Provided url will be resolved as OpenAPI definition. Then the algorithm works
recursively and resolves all `JSON-References` inside the resolved OpenAPI definition.

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

> *__Note:__ you can provide `Swagger.resolve` both `spec` and `url` options. In that case
`spec` will always be preferred and `url` option will be ignored.* 

#### Authentication

When JSON-References points to a remote document protected by authentication,
`requestInterceptor` option can be used to provide request authentication (e.g. by setting `Authentication` header).

```js
import SwaggerClient from 'swagger-client';

const requestInterceptor = request => {
  if (request.loadSpec) {
    request.headers['Authorization'] = 'Bearer Asdf1234ThisIsMyToken';
  }

  return request;
};

SwaggerClient.resolve({ 
  url: 'https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml',
  requestInterceptor,
});
```

> *__Note:__ Notice how we use [loadSpec](http-client.md#loading-specification) Request property to determine if the intercepted request was made to fetch the OAS definition.*



#### Errors

Resolver can also produce errors on various problems inside OpenAPI definition.
One of those problems can be invalid `JSON-Reference`.

```js
import SwaggerClient from 'swagger-client';

const pojoDefiniton = {
  a: 1,
  b: {
    $ref: 1,
  }
};

SwaggerClient.resolve({ spec: pojoDefiniton }); 
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

#### Alternate API

##### Resolve during instantiation

Along with calling `resolve` statically from a `SwaggerClient` class, resolution can
happen during `SwaggerClient` class instantiation.

**POJO usage**

```js
import SwaggerClient from 'swagger-client';

const pojoDefinition = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

new SwaggerClient({ spec: pojoDefinition }).then(swaggerClient => {
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

##### Re-resolve the definition

It's possible (as a convenience) to re-resolve your definition from `resolve` instance method.

```js
import SwaggerClient from 'swagger-client';

const pojoDefinition = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

new SwaggerClient({ spec: pojoDefinition })
  .then(swaggerClient => swaggerClient.resolve()) // definition will be re-resolved again
  .then(swaggerClient => {
    swaggerClient.spec;
    swaggerClient.originalSpec;
    swaggerClient.errors;
  });
```

#### Options

Along with `spec` and `url`, there are other options that controls the resolution
algorithm behavior.

Type notations are formatted like so:

- `String=""` means a String type with a default value of `""`.
- `String=["a"*, "b", "c", "d"]` means a String type that can be `a, b, c, or d`, with the `*` indicating that `a` is the default value.

Option | Description 
--- | ---
`fetch` | `Function=Http`. Alias for `http`. The option is part of API due to compatibility reasons.
`http` | `Function=Http`. If provided this function will be used as primary HTTP fetch mechanism for resolution. The provided function must return a `Promise` and must be compatible with our [HTTP Client](http-client.md). 
`mode` | `String=["nostrict", "strict"]`. If `strict`, don't process `allOf` JSON-References.
`allowMetaPatches` | `Boolean=true`. Allows adding `.meta` patches, which include adding `$$ref`s to the resolved definition. `$$ref` is a meta information created from the original JSON Reference. <br /><br /> **Original definition:** <br /><br /> `{"a":{"val":1},"b":{"$ref":"#/a"}}` <br /><br /> **Resolved definition:** <br /><br /> `{"a":{"val":1},"b":{"val":1,"$$ref":"#/a"}}`
`pathDiscriminator` | `Array=[]`. Example value can be e.g. `['components', 'schemas']`. This tells the resolver to only resolve all `Json-Reference` on this path and leave the rest untouched. Can be used for lazy resolution.
`modelPropertyMacro` | `Function=null`. If provided, accepts a `property` object e.g. `{type: 'integer', format: 'int64' }` and computes a default value. That computed value is then assigned into original `property` object under the key `default`; `{type: 'integer', format: 'int64', default: 1 }`
`parameterMacro` | `Function=null`. If provided, accepts a `parameter` object e.g. `{ name: 'offset', in: 'query' }` and computes a default value. That computed value is then assigned into original `parameter` object under the key `default`; `{ name: 'offset', in: 'query', default: 1 }`
`requestInterceptor` | `Function=identity`. Intercepts and possibly transform a request before it is handled.
`responseInterceptor` | `Function=identity`. Intercepts and possibly transform a response before it is  handled.
`skipNormalization` | `Boolean=false`. Normalization creates unique operationIds when explicit operationIds are duplicates, and preserve originals.
`useCircularStructures` | `Boolean=false`. Prevents circular values from being constructed, unless you specifically want that to happen. If set to `false`, just leave the references unresolved.
`baseDoc` | `String=null`. If provided in the form of `URL`, will be able to resolve circular `JSON-References`.

#### Sub-Tree resolver

When working with a large JSON OpenAPI definition, it's often convenient to resolve `JSON-References`
in only part of the JSON OpenAPI definition tree. Our sub-tree resolver does exactly that.

```js
import SwaggerClient from 'swagger-client';

const pojoDefinition = {
  a: 1,
  b: {
    $ref: '#/a',
  }
};

SwaggerClient.resolveSubtree(pojoDefinition, ['b']);
/**
 * Promise({
 *   spec: 1,
 *   errors: [],  
 * } 
 */
```

> *__Note:__ third argument is optional and if provided it must be of the shape of `Options` documented below.*

Option | Description
--- | ---
`returnEntireTree` | `Boolean=false`. If set to true, returns only resolved part of OpenAPI definition tree determined by `path` (second argument).
`modelPropertyMacro` | `Function=null`. If provided, accepts a `property` object e.g. `{type: 'integer', format: 'int64' }` and computes a default value. That computed value is then assigned into original `property` object under the key `default`; `{type: 'integer', format: 'int64', default: 1 }`
`parameterMacro` | `Function=null`. If provided, accepts a `parameter` object e.g. `{ name: 'offset', in: 'query' }` and computes a default value. That computed value is then assigned into original `parameter` object under the key `default`; `{ name: 'offset', in: 'query', default: 1 }`
`requestInterceptor` | `Function=identity`. Intercepts and possibly transform a request before it is handled.
`responseInterceptor` | `Function=identity`. Intercepts and possibly transform a response before it is  handled.
`useCircularStructures` | `Boolean=false`. Prevents circular values from being constructed, unless you specifically want that to happen. If set to `false`, just leave the references unresolved.
`baseDoc` | `String=null`. If provided in the form of `URL`, will be able to resolve circular `JSON-References`.

##### Cache

Resolver algorithm caches results of remotely fetched and resolved OpenAPI definitions in an internal cache. 
When using long-running threads that periodically pulls a OpenAPI definitions,
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

> *__Note:__ An internal cache is only involved when doing resolution on remote URLs.*
