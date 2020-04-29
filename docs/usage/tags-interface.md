# Tags Interface

Tags Interface acts as a client for [OAS operations](https://swagger.io/docs/specification/paths-and-operations/).
Every OAS operationId is internally transformed into [callable](https://2ality.com/2013/08/es6-callables.html).
Every callable OAS operationId (when called) returns a [Response](http-client.md#response) locked inside a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

OAS operationIds are meant to be unique within OpenAPI definition, if they're not we do the following:

- If a **tag** is **absent**, we use `default` as the internal tag to group all operationIds

```yaml
paths:
  /pet/findByStatus:
    get:
      summary: Finds pets by Status
      operationId: getUserById
```

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ spec })
  .then(client => client.apis.default.getUserById(...));
// => Promise.<Response>
```

- If an **operationId** is **missing**, we deduce it from the http method and pathName, i.e. `${method}${pathName}`, with non-alphanumeric characters escaped to `_` character.

```yaml
paths:
  /one:
    get:
      summary: Gets one      
```

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ spec })
  .then(client => client.apis.default.getOne(...));
// => Promise.<Response>
```

- If an **operationId** is **duplicated** across all operationIds of the spec, we rename all of them with numbers after the operationId to keep them unique. You should not rely on this, as the renaming is non-deterministic.

```yaml
paths:
  /one:
    get:
      summary: Gets one  
      operationId: operation   
  /two:
    get: 
      summary: Gets two
      operationId: operation
  /three:
    get:
      summary: Gets three
      operationId: operation
```

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ spec })
  .then(client => Promise.all([
    client.apis.default.operation1(...),
    client.apis.default.operation2(...),
    client.apis.default.operation3(...),
  ]));
// => Promise.<Response>
```

Below is a list of options that `SwaggerClient` recognizes when building an internal
representation of `Tags Interface`. These options are provided to `SwaggerClient` in following way:

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ 
  url: 'http://petstore.swagger.io/v2/swagger.json',
  disableInterfaces: false,
  v2OperationIdCompatibilityMode: false,
  ...other options...
});
```


Type notations are formatted like so:

- `String=""` means a String type with a default value of `""`.
- `String=["a"*, "b", "c", "d"]` means a String type that can be `a, b, c, or d`, with the `*` indicating that `a` is the default value.

Option | Description
--- | ---
`disableInterfaces` | `Boolean=false`. Disables the `Tags Interface` and transformation of all operationIds into callables.
`v2OperationIdCompatibilityMode` | `Boolean=false`. When set to `true`, `SwaggerClient` will use old algorithm for generating unique operationId names (present in version 2.x). Instead of [camel case](https://en.wikipedia.org/wiki/Camel_case) (`getOne`) the algorithm use [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles) (`get_one`).
`requestInterceptor` | `Function=identity`. Either synchronous or asynchronous function transformer that accepts `Request` and should return `Request`.  
`responseInterceptor` | `Function=identity`. Either synchronous or asynchronous function transformer that accepts `Response` and should return `Response`.
`userFetch` | `Function=cross-fetch`. Custom **asynchronous** fetch function that accepts two arguments: the `url` and the `Request` object and must return a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object.

> *__Note:__ for more information about [requestInterceptor](http-client.md#request-interceptor), [responseInterceptor](http-client.md#response-interceptor) and [userFetch](https://github.com/swagger-api/swagger-js/blob/master/docs/usage/http-client.md#custom-fetch), please refer to the [HTTP Client](http-client.md) documentation.*

### OpenAPI v2.x

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ url: 'http://petstore.swagger.io/v2/swagger.json' })
  .then(client => 
    client
     .apis
     .pet // tag name == `pet`
     .addPet({ // operationId == `addPet`
       id: 1,
       body: {
         name: 'bobby',
         status: 'available'
       }
     })
  );
// => Promise.<Response>
```

### OpenAPI v3.x

OpenAPI 3.0 definitions work in a similar way with the `Tags Interface`,
but you may need to provide additional data in an `Options` object for server variables
and request bodies, since these items are not actual parameters:

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient({ spec })
  .then(client => 
    client
     .apis
     .pet // tag name == `pet`
     .addPet( // operationId == `addPet`
       { id: 1 },
       { // Options object
         requestBody: {
           name: 'bobby',
           status: 'available',
         },
         server: 'http://petstore.swagger.io/{apiPrefix}', // this should exactly match a URL in your `servers`
         serverVariables: {
           apiPrefix: 'v2'
         }
       }    
     )
  );
// => Promise.<Response>
```
