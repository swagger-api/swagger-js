Swagger-JS
===========

[![Build Status](https://travis-ci.org/swagger-api/swagger-js.svg?branch=master)](https://travis-ci.org/swagger-api/swagger-js)

## New!

**This is the new version of swagger-js, 3.x. Want to learn more? Check out our [FAQ](http://swagger.io/new-ui-faq/).**

For the older version of swagger-js, refer to the [*2.x branch*](https://github.com/swagger-api/swagger-js/tree/2.x).

### Usage

##### Prerequisites
- Node 4.x
- NPM 2.x

##### Download via NPM

```
npm install swagger-client
```

##### Import in code

```javascript
import Swagger from 'swagger-client'
```

#### API

This lib exposes these functionalities:

1. HTTP Client
1. Swagger Spec Resolver
1. TryItOut Executor
1. Tags Interface
1. JS API

HTTP Client
-----------

`Swagger.http(req)` exposes a [Fetch-like interface](https://github.com/matthew-andrews/isomorphic-fetch) with a tweak: allowing `url` in the request object so that it can be passed around and mutated. It extends Fetch to support request and response interceptor and perform response & headers serialization. This method could be overridden to change how SwaggerJS performs HTTP requests.

```js
// Fetch-like, but support `url`
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
    res.statusText // status text
    res.body       // JSON object or undefined
    res.obj        // same as above, legacy
    res.text       // textual body
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
An HTTP client for OAI operations, maps an operation and values into a request/response.

```js
const params = {
  spec,
  operationId,
  (pathName),
  (method),
  parameters,
  securities,
  requestContentType,
  responseContentType
}

// Creates a request object compatible with HTTP client interface.
// If `pathName` and `method`, then those are used instead of operationId.
const req = Swagger.buildRequest(...params)
Swagger.execute({http, ...params})
```

Tags Interface
--------------
A JS client for operations. We're currently using the `apis[tag][operationId]:ExecuteFunction` interface, which can be disabled entirely using `Swagger({disableInterfaces: true})` if you don't need it.

OperationId's are meant to be unique within spec, if they're not we do the following:
- If a tag is absent, we use `default` as the internal tag
- If an operationId is missing, we deduce it from the http method and path, i.e. `${method}-${path}`
- If an operationId is duplicated across all operationIds of the spec, we suffix it with \_%d

```js
Swagger({...}).then((client) => {
  client.apis.pets.addPet({id: 1, name: "bobby"}).then(...)
})
```

JS API
------

Resolve the spec and expose some methods that use the resolved spec:

- `Swagger(url, opts): Promise`
- Exposes tags interface (see above)
- Exposes the static functions: `execute`, `http`, `resolve` and some other minor ones
- Exposes `#http`, `#execute` and `#resolve` bound to the instance

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
  data,
  obj
}

// New shape
{
  url,
  method,
  status,
  statusText,
  headers, // See note below regarding headers
  text,    // The textual content
  body,    // a JSON object
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

* You can construct a swagger-js client the same way as before.  There is a "legacy" mode for retaining the older style of API to the client--this can be disabled by passing the `{disableInterfaces: true}` option.  Note, you **cannot** use tags directly on the Swagger client.  You _must_ reference them through the `client.apis` object.  While supported in the 2.x series, this was not the most common method of addressing different operations assigned to a tag.

If you did this:

```js
client.pets
  .findPetById(...)
```

You must now do this:

```js
client.apis['pets']
  .findPetById(...)
```

* You _must_ use promises rather than success and error callbacks.  If your old code looked like this:

```js
client.apis['pets']
  .findPetById(
    {petId: 3},
    function(data) { /* success callback */},
    function(error) { /* error callback */ });
```

you now would call it like such:

```js
client.apis['pets'].findPetById({petId: 3})
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

* Until #971 is resolved, you _must_ apply authorizations on each operation.  Previously you could do this:

```js
new Swagger('http://petstore.swagger.io/v2/swagger.json',
  {
    authorizations: {
      my_basic_auth: new PasswordAuthorization('foo', 'bar')
    }
  })
```

You now must apply authorizations like this:

```
TODO
```