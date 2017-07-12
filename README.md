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
- Runtime: 
  - browser: es5 compatible. IE11+ 
  - node v4.x.x
- Building
  - node v6.x.x 

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

##### Import in browser

```html
<script src='browser/swagger-client.js' type='text/javascript'></script>
<script>
var swaggerClient = new SwaggerClient(specUrl);
</script>
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

Swagger Specification Resolver
---------------------

`Swagger.resolve({url, spec, http})` resolves `$ref`s (JSON-Refs) with the objects they point to.

```js

Swagger.resolve({url, spec, http}).then((resolved) => {
  resolved.errors // resolution errors, if any
  resolved.spec   // the resolved spec
})
```
> This is done automatically if you use the constructor/methods

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
const req = Swagger.buildRequest({...params})
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
- If an operationId is missing, we deduce it from the http method and path, i.e. `${method}${path}`, with non-alphanumeric characters escaped to `_`. See these tests ([1](https://github.com/swagger-api/swagger-js/blob/7da5755fa18791cd114ecfc9587dcd1b5c58ede1/test/helpers.js#L7), [2](https://github.com/swagger-api/swagger-js/blob/7da5755fa18791cd114ecfc9587dcd1b5c58ede1/test/helpers.js#L77)) for examples.
- If an operationId is duplicated across all operationIds of the spec, we rename all of them with numbers after the ID to keep them unique. You should not rely on this, as the renaming is non-deterministic. See [this test](https://github.com/swagger-api/swagger-js/blob/7da5755fa18791cd114ecfc9587dcd1b5c58ede1/test/helpers.js#L127) for an example.

```js
Swagger({...}).then((client) => {
    client
      .apis
      .pet // tag name == `pet`
      .addPet({id: 1, name: "bobby"}) // operationId == `addPet`
      .then(...) 
})
```

In Browser 
----------

Prepare swagger-client.js by `npm run build-bundle` 
Note, browser version exports class `SwaggerClient` to global namespace
If you need activate CORS requests, just enable it by `withCredentials` property at `http`

```html
<html>
<head>
<script src='browser/swagger-client.js' type='text/javascript'></script>
<script>
var specUrl = 'http://petstore.swagger.io/v2/swagger.json'; // data urls are OK too 'data:application/json;base64,abc...'
var swaggerClient = new SwaggerClient(specUrl)
      .then(function (swaggerClient) {                                            
          swaggerClient.http.withCredentials = true; // this activates CORS, if necessary
                   
          return swaggerClient.apis.pet.addPet({id: 1, name: "bobby"}); // chaining promises
      }, function (reason) {
         console.error("failed to load the spec" + reason);
      })
      .then(function(addPetResult) {
         console.log(addPetResult.obj); 
         // you may return more promises, if necessary
      }, function (reason) {
          console.error("failed on API call " + reason);
      });    
})
</script>
</head>
<body>
  check console in browser's dev. tools
</body>
</html>

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
npm run test         # run test
npm run test:watch   # run test with change watching
npm run lint         # run lint
npm run build        # package to release
npm run build-bundle # build browser version available at .../browser
```

# Migration from 2.x

There has been a complete overhaul of the codebase. 
For notes about how to migrate coming from 2.x,
please see [Migration from 2.x](docs/MIGRATION_2_X.md)

### Graveyard

For features known to be missing from 3.x please see [the Graveyard](docs/GRAVEYARD.md)
