# Swagger JS library

[![Build Status](https://travis-ci.org/swagger-api/swagger-js.svg?branch=master)](https://travis-ci.org/swagger-api/swagger-js)
[![NPM version](https://badge.fury.io/js/swagger-client.svg)](http://badge.fury.io/js/swagger-client)

This is the Swagger javascript client for use with [swagger](http://swagger.io) enabled APIs.
It's written in javascript and tested with mocha, and is the fastest way to enable a javascript client to communicate with a swagger-enabled server.

Check out [Swagger-Spec](https://github.com/swagger-api/swagger-spec) for additional information about the Swagger project, including additional libraries with support for other languages and more.


### Calling an API with swagger + node.js!

Install swagger-client:
```
npm install swagger-client
```

or:

```
bower install swagger-js
```

Then let swagger do the work!
```js
var Swagger = require('swagger-client');

var client = new Swagger({
  url: 'http://petstore.swagger.io/v2/swagger.json',
  success: function() {
    client.pet.getPetById({petId:7},{responseContentType: 'application/json'},function(pet){
      console.log('pet', pet);
    });
  }
});
```

NOTE: we're explicitly setting the responseContentType, because we don't want you getting stuck when 
there is more than one content type available.

That's it!  You'll get a JSON response with the default callback handler:

```json
{
  "id": 1,
  "category": {
    "id": 2,
    "name": "Cats"
  },
  "name": "Cat 1",
  "photoUrls": [
    "url1",
    "url2"
  ],
  "tags": [
    {
      "id": 1,
      "name": "tag1"
    },
    {
      "id": 2,
      "name": "tag2"
    }
  ],
  "status": "available"
}
```

### Handling success and failures

You need to pass success and error functions to do anything reasonable with the responses:

```js
var Swagger = require('swagger-client');

var client = new Swagger({
  url: 'http://petstore.swagger.io/v2/swagger.json',
  success: function() {
    client.pet.getPetById({petId:7}, function(success){
      console.log('succeeded and returned this object: ' + success.obj);
    },
    function(error) {
      console.log('failed with the following: ' + error.statusText);
    });
  }
});
```

You can use promises, too, by passing the `usePromise: true` option:

```js
var Swagger = require('swagger-client');

new Swagger({
  url: 'http://petstore.swagger.io/v2/swagger.json',
  usePromise: true
})
.then(function(client) {
  client.pet.getPetById({petId:7})
    .then(function(pet) {
      console.log(pet.obj);
    })
    .catch(function(error) {
      console.log('Oops!  failed with message: ' + error.statusText);
    });
});
```

Need to pass an API key?  Configure one in your client instance as a query string:

```js
client.clientAuthorizations.add("apiKey", new Swagger.ApiKeyAuthorization("api_key","special-key","query"));
```

...or with a header:

```js
client.clientAuthorizations.add("apiKey", new Swagger.ApiKeyAuthorization("api_key","special-key","header"));
```

...or with the swagger-client constructor:

```js
var client = new Swagger({
  url: 'http://example.com/spec.json',
  success: function() {},
  authorizations : {
    easyapi_basic: new Swagger.PasswordAuthorization('<username>', '<password>'),
    someHeaderAuth: new Swagger.ApiKeyAuthorization('<nameOfHeader>', '<value>', 'header'),
    someQueryAuth: new Swagger.ApiKeyAuthorization('<nameOfQueryKey>', '<value>', 'query'),
    someCookieAuth: new Swagger.CookieAuthorization('<cookie>'),
  }
});
```

Note the authorization nickname, such as `easyapi_basic` in the above example, must match the `security` requirement in the specification (see the [OAI Specification](https://github.com/OAI/OpenAPI-Specification/blob/master/README.md) for details).

You can also pass authorzations on a _per-request_ basis, in the event that you're reusing a `swagger-client` object across multiple connections:

```
client.pet.addPet({pet: {
    name: 'doggie'
  }}, {
    clientAuthorizations: {
      api_key: new Swagger.ApiKeyAuthorization('foo', 'bar', 'header')
    }
  })
  .then(function(pet) {
    console.log(pet.obj);
  });
```


### Calling an API with swagger + the browser!

Download [`browser/swagger-client.min.js`](https://raw.githubusercontent.com/swagger-api/swagger-js/master/browser/swagger-client.min.js) and place it into your webapp:

```html
<script src='browser/swagger-client.js' type='text/javascript'></script>
<script type="text/javascript">
  // initialize swagger client, point to a resource listing
  window.client = new SwaggerClient({
    url: "http://petstore.swagger.io/v2/swagger.json",
    success: function() {
      // upon connect, fetch a pet and set contents to element "mydata"
      client.pet.getPetById({petId:1},{responseContentType: 'application/json'}, function(data) {
        document.getElementById("mydata").innerHTML = JSON.stringify(data.obj);
      });
    }
  });
</script>

<body>
  <div id="mydata"></div>
</body>
```

### Need to send an object to your API via POST or PUT?
```js
var pet = {
  id: 100,
  name: "dog"};

// note: the parameter for `addPet` is named `body` in the example below
client.pet.addPet({body: pet});
```

### Sending XML in as a payload to your API?
```js
var pet = "<Pet><id>2</id><name>monster</name></Pet>";

client.pet.addPet({body: pet}, {requestContentType:"application/xml"});
```

### Need XML response? (assuming your server can produce it)
```js
client.pet.getPetById({petId:1}, {responseContentType:"application/xml"});
```

### Custom request signing
You can easily write your own request signing code for Swagger.  For example:

```js
var CustomRequestSigner = function(name) {
  this.name = name;
};

CustomRequestSigner.prototype.apply = function(obj, authorizations) {
  var hashFunction = this._btoa;
  var hash = hashFunction(obj.url);

  obj.headers["signature"] = hash;
  return true;
};
```

In the above simple example, we're creating a new request signer that simply
Base64 encodes the URL.  Of course you'd do something more sophisticated, but
after encoding it, a header called `signature` is set before sending the request.

You can add it to the swagger-client like such:

```js
client.clientAuthorizations.add('my-auth', new CustomRequestSigner());
```

### Setting headers

Headers are a type of `parameter`, and can be passed with the other parameters. For example, if you supported translated pet details via the `Accept-Language` header:

```js
"parameters": [
  {
    "name": "petId",
    "description": "ID of pet that needs to be fetched",
    "required": true,
    "type": "integer",
    "format": "int64",
    "paramType": "path",
    "minimum": "1.0",
    "defaultValue": 3,
    "maximum": "100000.0"
  },
  "LanguageHeader": {
    "name": "Accept-Language",
    "in": "header",
    "description": "Specify the user's language",
    "required": false,
    "type": "string"
  }
...
```

Then you would pass the header value via the parameters ([header parameters are case-insenstive](https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2)):

```js

client.pet.getPetById({
  petId: 7,
  'accept-language': 'fr'
}, function(pet){
  console.log('pet', pet);
});

```

### Using your own HTTP client

Don't like [superagent](https://github.com/visionmedia/superagent)? Despise [JQuery](https://github.com/jquery/jquery)?  Well, you're in luck.  You can plug your own HTTP library easily:

```js
var myHttpClient = {
  // implment an execute function
  execute: function(obj) {
    var httpMethod = obj.method;
    var requestHeaders = obj.headers;
    var body = obj.body;
    var url = obj.url;
    // do your thing, and call `obj.on.response`
    if(itWorked) {
      obj.on.response('horray');
    }
    else {
      obj.on.error('boo');
    }
  }
};

var client = new SwaggerClient({
  spec: petstoreRaw,
  client: myHttpClient,
  success: function () {
    client.pet.getPetById({petId: 3}, function(data){
      expect(data).toBe('ok');
      done();
    });
  }
});
```

### How does it work?
The swagger javascript client reads the swagger api definition directly from the server.  As it does, it constructs a client based on the api definition, which means it is completely dynamic.  It even reads the api text descriptions (which are intended for humans!) and provides help if you need it:

```js
s.apis.pet.getPetById.help()
'* petId (required) - ID of pet that needs to be fetched'
```

The HTTP requests themselves are handled by the excellent [superagent](https://github.com/visionmedia/superagent) library, which has a ton of features itself.  But it runs on both node and the browser.


Development
-----------

Please [fork the code](https://github.com/swagger-api/swagger-js) and help us improve swagger-js. Send us a pull request to the `master` branch!  Tests make merges get accepted more quickly.

Note!  We _will not_ merge pull requests for features not supported in the OAI Specification!  Add an issue there instead!

swagger-js use gulp for Node.js.

```bash
# Install the gulp client on the path
npm install -g gulp

# Install all project dependencies
npm install
```

```bash
# List all tasks.
gulp -T

# Run lint (will not fail if there are errors/warnings), tests (without coverage) and builds the browser binaries
gulp

# Run the test suite (without coverage)
gulp test

# Build the browser binaries (One for development with source maps and one that is minified and without source maps) in the browser directory
gulp build

# Continuously run the test suite:
gulp watch

# Run jshint report
gulp lint

# Run a coverage report based on running the unit tests
gulp coverage
```

License
-------

Copyright 2016 SmartBear Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---
<img src="http://swagger.io/wp-content/uploads/2016/02/logo.jpg"/>
