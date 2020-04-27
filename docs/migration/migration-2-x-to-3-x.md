# Migration from 2.x to 3.x

There are major changes from the `2.x` release.

The new `swagger-client` is _almost_ a drop-in replacement for the 2.x series _depending_ on your style of integration.
While effort was put in, to make the transition smooth. This is still a breaking release, and we hope to cover the most common features.

> *__Note:__ Before you start, please verify the minimum requirements to use the library. They have changed.*

### Specification version

Support for `1.0`, `1.1` and `1.2` versions of the Swagger specification **have been dropped!**
You'll need to stick with `swagger-client@2.x` if you need to support those versions. 
But we encourage updating to `OAS 2.0`.

#### Promises.

The new `swagger-client`, uses promises and removes the older style of callbacks.
As such creating an instance of SwaggerClient will return a promise.

If you did this:

```js
const client = new SwaggerClient({ success, failure, ...});

function success() {
  client.pet.addPet(...);
}
```

You must now do this:

```js
SwaggerClient({...}).then(client => {
  client.pet.addPet(...) 
})
```

#### Tags interface

> *__Note:__ You **cannot** use tags directly on the Swagger client.  You _must_ reference them through the `client.apis` object.  While supported in the 2.x series, this was not the most common method of addressing different operations assigned to a tag.*


If you did this:

```js
client.pet
  .findPetById(...);
```

You must now do this:

```js
client.apis.pet 
  .findPetById(...);
```

#### Promises in executors
* You _must_ use promises rather than success and error callbacks.  If your old code looked like this:

```js
client.apis.pet
  .findPetById(
    { petId: 3 },
    data => { /* success callback */},
    error => { /* error callback */ }
  );
```

you now would call it like such:

```js
client.apis.pet.findPetById({ petId: 3 })
  .then(data => { /* success callback */})
  .catch(error => {/* error callback */ });
```

* The _parsed_ response body object in response payloads has a new key name.  If you previously did this:

```js
function print(response) {
  // print out the parsed object
  console.log(response.obj);
}
```

You now do this:

```js
function print(response) {
  // print out the parsed object
  console.log(response.body);
}
```

#### Authorizations

Previously you would add authorizations ( tokens, keys, etc ) as such...
```js
const client = new Swagger('http://petstore.swagger.io/v2/swagger.json', {
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
const client = new Swagger('http://petstore.swagger.io/v2/swagger.json', ...)
// Basic Auth
client.clientAuthorizations.add('my_query_auth', new ApiKeyAuthorization('my-query', 'bar', 'query'))
client.clientAuthorizations.add('my_header_auth', new ApiKeyAuthorization('My-Header', 'bar', 'header'))
client.clientAuthorizations.add('my_basic_auth', new PasswordAuthorization('foo', 'bar'))
client.clientAuthorizations.add('cookie', new CookieAuthorization('one=two'))
```

Currently you'd use...

> *__NOTE:__ We're working on changing this to be friendlier to use and to support the config file interface.*
> *See: https://github.com/swagger-api/swagger-js/issues/971*

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
}).then( client => ... );
```

- One missing element is missing authentication for fetching the specification itself, that is tracked...
https://github.com/swagger-api/swagger-ui/issues/2793


> NOTE: Cookie authentication is not implemented. 

#### Default Content-Type values

`swagger-client` no longer assumes you want `Content-Type: application/json` if you don't provide any `consumes` values. If you want to preserve that behavior, you'll need to implement it yourself with a `requestInterceptor`:

```js
Swagger({
  url: "http://petstore.swagger.io/v2/swagger.json",
  requestInterceptor: req => {
    if(req.body && !req.headers["Content-Type"]) {
      req.headers["Content-Type"] = "application/json"
    }
  }
})
```
