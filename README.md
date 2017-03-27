Swagger-JS
===========

[![Build Status](https://travis-ci.org/swagger-api/swagger-js.svg?branch=master)](https://travis-ci.org/swagger-api/swagger-js)

## New!

**This is the new version of swagger-js, 3.x. Want to learn more? Check out our [FAQ](http://swagger.io/new-ui-faq/).**

For the older version of swagger-js, refer to the [*2.x branch*](https://github.com/swagger-api/swagger-js/tree/2.x).


## Note:
The npm package is called `swagger-client` and the GitHub repository is `swagger-js`.
We'll be consolidating that soon. Just giving you the heads up. You may see references to both names.

### Usage

##### Prerequisites
- Node 4.x
- npm 2.x

##### Download via npm

```
npm install swagger-client
```

##### Import in code

```javascript
import Swagger from 'swagger-client'
// Or commonjs
const Swagger = require('swagger-client') 
```

#### API

This lib exposes these functionalities:

- Static functions for...
  -  HTTP Client
  - Swagger Spec Resolver ( OAS 2.0 )
  - TryItOut Executor
- A constructor with the methods...
  - HTTP Client, for convenience
  - Swagger Spec Resolver ( OAS 2.0 ), which will use `url` or `spec` from the instance
  - TryItOut Executor, bound to the `http` and `spec` instance properties
  - Tags Interface, also bound to the instance

HTTP Client
-----------

`Swagger.http(req)` exposes a [Fetch-like interface](https://github.com/matthew-andrews/isomorphic-fetch) with a twist: allowing `url` in the request object so that it can be passed around and mutated. It extends Fetch to support request and response interceptors and performs response & header serialization. This method could be overridden to change how SwaggerJS performs HTTP requests.

```js
// Fetch-like, but support `url`, `query` and `xxxInterceptor`
const request = {
  url,
  query,
  method,
  body,
  headers,
  requestInterceptor,
  responseInterceptor
}

Swagger.http(request)
  .then((res) => {
    res.statusCode // status code
    res.statusText // status text, ie: "Not Found"
    res.body       // JSON object or undefined
    res.obj        // same as above, legacy
    res.text       // textual body, or Blob
    res.headers    // header hash
  })
  .catch((err) => {
    err            // instanceof Error
    err.response   // response or null
  })

// Interceptors
Swagger.http({
  requestInterceptor: (req: Request) => Request
  responseInterceptor: (res: Response) => Response
})

```

Swagger Spec Resolver
---------------------

`Swagger.resolve({url, spec, http})` resolves `$ref`s (JSON-Refs) with the objects they point to.

```js

Swagger.resolve({url, spec, http}).then((resolved) => {
  resolved.errors // resolution errors, if any
  resolved.spec   // the resolved spec
})
```

TryItOut Executor
-----------------
An HTTP client for OAS operations, maps an operation and values into an HTTP request.

```js
const params = {
  spec,

  operationId, // Either operationId, or you can use pathName + method
  (pathName),
  (method),

  parameters, // _named_ parameters in an object, eg: { petId: 'abc' }
  securities, // _named_ securities, will only be added to the request, if the spec indicates it. eg: {apiKey: 'abc'}
  requestContentType, 
  responseContentType,

  (http), // You can also override the HTTP client completely
}

// Creates a request object compatible with HTTP client interface.
// If `pathName` and `method`, then those are used instead of operationId. This is useful if you're using this dynamically, as `pathName` + `method` are guarenteed to be unique.
const res = Swagger.execute({...params})

// You can also generate just the request ( without executing... )
const req = Swagger.buildRequest(...params)
```

Constructor and methods
-----------------------

Resolve the spec and expose some methods that use the resolved spec:

- `Swagger(url, opts): Promise`
- Exposes tags interface (see above)
- Exposes the static functions: `execute`, `http`, `resolve` and some other minor ones
- Exposes `#http`, `#execute` and `#resolve` bound to the instance

```javascript
Swagger('http://petstore.swagger.io/v2/swagger.json')
  .then( client => {
      client.spec // The resolved spec
      client.originalSpec // In case you need it
      client.errors // Any resolver errors

      // Tags interface 
      client.apis.pet.addPet({id: 1, name: "bobby"}).then(...)

      // TryItOut Executor, with the `spec` already provided
      client.execute({operationId: 'addPet', parameters: {id: 1, name: "bobby") }).then(...) 
   })

```

Tags Interface
--------------
A client for operations. We're currently using the `apis[tag][operationId]:ExecuteFunction` interface, which can be disabled entirely using `Swagger({disableInterfaces: true})` if you don't need it.

OperationId's are meant to be unique within spec, if they're not we do the following:
- If a tag is absent, we use `default` as the internal tag
- If an operationId is missing, we deduce it from the http method and path, i.e. `${method}-${path}`
- If an operationId is duplicated across all operationIds of the spec, we suffix it with \_%d

```js
Swagger({...}).then((client) => {
    client
      .apis
      .pet // tag name == `pet`
      .addPet({id: 1, name: "bobby"}) // operationId == `addPet`
      .then(...) 
})
```

Compatibility
-------------

SwaggerJS has some legacy signature _shapes_.

### Execute
##### Response shape
```js
// swagger-js
{
  url,
  method,
  status,
  statusText,
  headers,

  data, // The textual content
  obj   // The body object
}

// New shape
{
  url,
  method,
  status,
  statusText,
  headers, // See note below regarding headers

  text,    // The textual content
  body,    // The body object
}
```

##### Serializing Headers

By default the instance version of `#http` serializes the body and headers.
However, headers pose an issue when there are multiple headers with the same name.
As such we've left the static version of `http` to not perform any serialization.

### Build

```sh
npm install
npm run test       # run test
npm run test:watch # run test with change watching
npm run lint       # run lint
npm run build      # package to release
```

### Migration from 2.x

There are major changes from the 2.x release.  Please look at the [release notes](https://github.com/swagger-api/swagger-js/releases/tag/v3.0.2) for the breaking changes.

The new swagger-js is _almost_ a drop-in replacement for the 2.x series _depending_ on your style of integration.  For migrating from a 2.x to 3.x implementation, it is important to understand the changes per the release notes.  Below is a quick-start for integrating with the 3.x version.

* Before you start, please verify the minimum requirements to use the library.  They have changed.

#### Promises.
The new swagger-js, uses promises and removes the older style of callbacks.
As such creating an instance of SwaggerClient will return a promise.

If you did this:

```js
var client = new SwaggerClient({ success, failure, ...})
function success() {
  client.pet.addPet(...) 
}
```

You must now do this:

```js
SwaggerClient({...}).then(client => {
  client.pet.addPet(...) 
})
```

#### Tags interface
Note, you **cannot** use tags directly on the Swagger client.  You _must_ reference them through the `client.apis` object.  While supported in the 2.x series, this was not the most common method of addressing different operations assigned to a tag.


If you did this:

```js
client.pet
  .findPetById(...)
```

You must now do this:

```js
client.apis.pet 
  .findPetById(...)
```

#### Promises in executors
* You _must_ use promises rather than success and error callbacks.  If your old code looked like this:

```js
client.apis.pet
  .findPetById(
    {petId: 3},
    function(data) { /* success callback */},
    function(error) { /* error callback */ });
```

you now would call it like such:

```js
client.apis.pet.findPetById({petId: 3})
  .then(function(data) { /* success callback */},
  .catch(function(error) {/* error callback */ }));
```

* The _parsed_ response body object in response payloads has a new key name.  If you previously did this:

```js
function(response) {
  // print out the parsed object
  console.log(response.obj);
}
```

You now do this:

```js
function(response) {
  // print out the parsed object
  console.log(response.body);
}
```

#### Authorizations

Previously you would add authorizations ( tokens, keys, etc ) as such...
```js
var client = new Swagger('http://petstore.swagger.io/v2/swagger.json', {
  authorizations: {
    my_query_auth: new ApiKeyAuthorization('my-query', 'bar', 'query'),
    my_header_auth: new ApiKeyAuthorization('My-Header', 'bar', 'header'),
    my_basic_auth: new PasswordAuthorization('foo', 'bar'),
    cookie_: new CookieAuthorization('one=two')
  }
})
```

Or like this...
```js
var client = new Swagger('http://petstore.swagger.io/v2/swagger.json', ...)
// Basic Auth
client.clientAuthorizations.add('my_query_auth', new ApiKeyAuthorization('my-query', 'bar', 'query'))
client.clientAuthorizations.add('my_header_auth', new ApiKeyAuthorization('My-Header', 'bar', 'header'))
client.clientAuthorizations.add('my_basic_auth', new PasswordAuthorization('foo', 'bar'))
client.clientAuthorizations.add('cookie', new CookieAuthorization('one=two'))
```

Pending the above issue, the newer syntax would be...
```javascript
Swagger('http://petstore.swagger.io/v2/swagger.json', {
  authorizations: {
    // Type of auth, is inferred from the specification provided 
    my_basic_auth: { username: 'foo', password: 'bar' },
    my_query_auth: 'foo', 
    my_header_auth: 'foo', 
    my_oauth2_token: { token: { access_token: 'abcabc' } },
    cookie_auth: null, // !!Not implemented
  }
}).then( client => ... )
```

## NOTE: Cookie authentication is not implemented yet


### Graveyard
During the course of the refactor some items were left behind. Some of these may be resuscitated as needed. But for the most part we can consider them dead

- client.apisArray
  - client.apisArray[i].operationsArray
- client.modelsArray
- client.authorizationScheme
- client.basePath
- client.build
- client.buildFrom1_1Spec
- client.buildFrom1_2Spec
- client.buildFromSpec
- client.clientAuthorizations
- client.convertInfo
- client.debug
- client.defaultErrorCallback
- client.defaultSuccessCallback
- client.enableCookies
- client.fail
- client.failure
- client.finish
- client.help
- client.host
- client.idFromOp
- client.info
- client.initialize
- client.isBuilt
- client.isValid
- client.modelPropertyMacro
- client.models
- client.modelsArray
- client.options
- client.parameterMacro
- client.parseUri
- client.progress
- client.resourceCount
- client.sampleModels
- client.selfReflect
- client.setConsolidatedModels
- client.supportedSubmitMethods
- client.swaggerRequestHeaders
- client.tagFromLabel
- client.title
- client.useJQuery
- client.jqueryAjaxCach

- client.apis[tag]
  - .apis
  - .asCurl
  - .description
  - .externalDocs
  - .help
  - .label
  - .name
  - .operation
  - .operations
  - .operationsArray
  - .path
  - .tag
