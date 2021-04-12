# Swagger Client API

Swagger Client exposes these functionalities for OpenAPI 2.0 and OpenAPI 3:

- Static methods for...
  - HTTP Client (`http`)
  - Document Resolver (monolithic & subtree) (`resolve`, `resolveSubtree`)
  - HTTP client for OAS operations (`buildRequest`, `execute`)
- A constructor with the methods...
  - HTTP Client, for convenience (`http`)
  - Document Resolver, which will use `url` or `spec` from the instance (`resolve`)
  - HTTP client for OAS operations, bound to the `http` and `spec` instance properties (`execute`)
  - Tags Interface, also bound to the instance 

It is also possible to use SwaggerClient without explicitly instantiating the constructor.

```js
import SwaggerClient from 'swagger-client';

new SwaggerClient('http://petstore.swagger.io/v2/swagger.json');
SwaggerClient('http://petstore.swagger.io/v2/swagger.json');
// these two lines are equivalent
```

If you call the constructor as function, constructor is instantiated for you implicitly.
