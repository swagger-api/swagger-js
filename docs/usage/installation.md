# Installation

## Distribution channels

### NPM Registry

We publish single module to npm: [swagger-client](https://www.npmjs.com/package/swagger-client).
`swagger-client` is meant for consumption by any JavaScript engine (node.js, browser, etc...).
The npm package contains transpiled and minified ES5 compatible code.

```shell script
 $ npm install swagger-client
``` 

**Increasing installation speed:**

`swagger-client` integrates with [ApiDOM](https://github.com/swagger-api/apidom) and use it
as a direct dependency. Some transitive dependencies of ApiDOM are [optional](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#optionaldependencies),
which means we can use [override package.json field](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides)
to speed up the installation:

```json
"overrides": {
  "@swagger-api/apidom-reference": {
    "@swagger-api/apidom-ns-asyncapi-2": "npm:-@0.0.1",
    "@swagger-api/apidom-ns-asyncapi-3": "npm:-@0.0.1",
    "@swagger-api/apidom-ns-openapi-2": "npm:-@0.0.1",
    "@swagger-api/apidom-ns-openapi-3-0": "npm:-@0.0.1",
    "@swagger-api/apidom-ns-openapi-3-1": "npm:-@0.0.1",
    "@swagger-api/apidom-ns-openapi-3-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-api-design-systems-json": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-api-design-systems-yaml": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-asyncapi-json-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-asyncapi-json-3": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-asyncapi-yaml-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-asyncapi-yaml-3": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-json": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-json-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-yaml-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-json-3-0": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-json-3-1": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-json-3-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-yaml-3-0": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-yaml-3-1": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-openapi-yaml-3-2": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-arazzo-json-1": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-arazoo-yaml-1": "npm:-@0.0.1",
    "@swagger-api/apidom-parser-adapter-yaml-1-2": "npm:-@0.0.1"
  }
}
```

> NOTE 1: Above override uses [empty npm package called "-"](https://www.npmjs.com/package/-) to override optional ApiDOM transitive dependencies.

> NOTE 2: When ApiDOM optional dependencies fail to install, you can safely ignore it as `swagger-client` can work without these optional dependencies.

After installed successfully:

[ES6 imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
```js
import SwaggerClient from 'swagger-client';
```

[CommonJS imports](https://en.wikipedia.org/wiki/CommonJS)
```js
const SwaggerClient = require('swagger-client');
```

### unpkg

You can embed Swagger UI's code directly in your HTML by using [unpkg's](https://unpkg.com/) interface.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>SwaggerClient test</title>
    <script src="https://unpkg.com/swagger-client"></script>
    <script>
      new SwaggerClient('http://petstore.swagger.io/v2/swagger.json')
        .then(
          client => client.apis.pet.addPet({ id: 1, body: { name: "bobby" } }),
          reason => console.error('failed to load the spec: ' + reason)
        )
        .then(
          addPetResult => console.log(addPetResult.body),
          reason => console.error('failed on api call: ' + reason)
        );
    </script>
  </head>
  <body>
    check console in browser's dev. tools
  </body>
</html>
```

See unpkg's main page for more information on how to use [unpkg](https://unpkg.com/).
