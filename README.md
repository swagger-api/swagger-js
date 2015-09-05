# Swagger JS library

[![Build Status](https://travis-ci.org/swagger-api/swagger-js.svg?branch=master)](https://travis-ci.org/swagger-api/swagger-js)

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
var client = require('swagger-client');

var swagger = new client({
  url: 'http://petstore.swagger.io/v2/swagger.json',
  success: function() {
    swagger.pet.getPetById({petId:7},{responseContentType: 'application/json'},function(pet){
      console.log('pet', pet);
    });
  }
});
```

NOTE: we're explicitly setting the responseContentType, because we don't want you getting stuck when there is more than one content type available.

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

Need to pass an API key?  Configure one as a querystring:

```js
client.clientAuthorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","query"));
```

...or with a header:

```js
client.clientAuthorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","header"));
```

...or with the swagger-client constructor:

```js
var swagger = new client({
  url: 'http://example.com/spec.json',
  success: function() {},
  authorizations : {
    easyapi_basic: new client.PasswordAuthorization('<name>', '<username>', '<password>'),
    someHeaderAuth: new client.ApiKeyAuthorization('<nameOfHeader>', '<value>', 'header'),
    someQueryAuth: new client.ApiKeyAuthorization('<nameOfQueryKey>', '<value>', 'query'),
    someCookieAuth: new client.CookieAuthorization('<cookie>'),
  }
});
```

### Calling an API with swagger + the browser!

Download `browser/swagger-client.js` into your webapp:

```js
<script src='browser/swagger-client.js' type='text/javascript'></script>
<script type="text/javascript">
  // initialize swagger, point to a resource listing
  window.swagger = new SwaggerClient({
    url: "http://petstore.swagger.io/api/api-docs",
    success: function() {
      // upon connect, fetch a pet and set contents to element "mydata"
      swagger.apis.pet.getPetById({petId:1},{responseContentType: 'application/json'}, function(data) {
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

swagger.pet.addPet({body: pet});
```

### Sending XML in as a payload to your API?
```js
var pet = "<Pet><id>2</id><name>monster</name></Pet>";

swagger.pet.addPet({body: pet}, {requestContentType:"application/xml"});
```

### Need XML response?
```js
swagger.pet.getPetById({petId:1}, {responseContentType:"application/xml"});
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
base 64 encodes the URL.  Of course you'd do something more sophisticated, but
after encoding it, a header called `signature` is set before sending the request.

### How does it work?
The swagger javascript client reads the swagger api definition directly from the server.  As it does, it constructs a client based on the api definition, which means it is completely dynamic.  It even reads the api text descriptions (which are intended for humans!) and provides help if you need it:

```js
s.apis.pet.getPetById.help()
'* petId (required) - ID of pet that needs to be fetched'
```

The HTTP requests themselves are handled by the excellent [shred](https://github.com/automatthew/shred) library, which has a ton of features itself.  But it runs on both node and the browser.


Development
-----------

Please [fork the code](https://github.com/swagger-api/swagger-js) and help us improve
swagger-client.js. Send us a pull request to the `master` branch!  Tests make merges get accepted more quickly.

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

Copyright 2011-2015 SmartBear Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
