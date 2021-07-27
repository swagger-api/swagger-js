# Installation

## Distribution channels

### NPM Registry

We publish single module to npm: [swagger-client](https://www.npmjs.com/package/swagger-client).
`swagger-client` is meant for consumption by any JavaScript engine (node.js, browser, etc...).
The npm package contains transpiled and minified ES5 compatible code.

```shell script
 $ npm install swagger-client
``` 

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

### Static files without HTTP or HTML

Once swagger-ui has successfully generated the `/dist` directory, 
you can copy files from that directory to your own file system and host from there.
