# Swagger JS library

[![Build Status](https://api.travis-ci.org/swagger-api/swagger-js.png)](https://travis-ci.org/swagger-api/swagger-js)

This is the Swagger javascript client for use with [swagger](http://swagger.io) enabled APIs.
It's written in javascript and tested with mocha, and is the fastest way to enable a javascript client to communicate with a swagger-enabled server.

## What's Swagger?

The goal of Swagger™ is to define a standard, language-agnostic interface to REST APIs which allows both humans and computers to discover and understand the capabilities of the service without access to source code, documentation, or through network traffic inspection. When properly defined via Swagger, a consumer can understand and interact with the remote service with a minimal amount of implementation logic. Similar to what interfaces have done for lower-level programming, Swager removes the guesswork in calling the service.


Check out [Swagger-Spec](https://github.com/swagger-api/swagger-spec) for additional information about the Swagger project, including additional libraries with support for other languages and more.


### Calling an API with swagger + node.js!

Install swagger-client:
```
npm install swagger-client
```

Then let swagger do the work!
```js
var client = require("swagger-client")

var swagger = new client.SwaggerClient({
  url: 'http://petstore.swagger.wordnik.com/v2/swagger.json',
  success: function() {
    swagger.apis.pet.getPetById({petId:1});
  }
});

```

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
client.authorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","query"));
```

...or with a header:

```js
client.authorizations.add("apiKey", new client.ApiKeyAuthorization("api_key","special-key","header"));
```

### Calling an API with swagger + the browser!

Download `swagger-client.js` and `shred.bundle.js` into your lib folder

```js
<script src='lib/shred.bundle.js' type='text/javascript'></script>
<script src='lib/swagger-client.js' type='text/javascript'></script>
<script type="text/javascript">
  // initialize swagger, point to a resource listing
  window.swagger = new SwaggerClient({
    url: "http://petstore.swagger.wordnik.com/api/api-docs",
    success: function() {
      // upon connect, fetch a pet and set contents to element "mydata"
      swagger.apis.pet.getPetById({petId:1}, function(data) {
        document.getElementById("mydata").innerHTML = JSON.stringify(data.obj);
      });
    }
  });

</script>
```

### Need to send an object to your API via POST or PUT?
```js
var pet = {
  id: 100,
  name: "dog"};

swagger.apis.pet.addPet({body: pet});
```

### Sending XML in as a payload to your API?
```js
var pet = "<Pet><id>2</id><name>monster</name></Pet>";

swagger.apis.pet.addPet({body: pet}, {requestContentType:"application/xml"});
```

### Need XML response?
```js
swagger.apis.pet.getPetById({petId:1}, {responseContentType:"application/xml"});
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
swagger-client.js. Send us a pull request and **we'll mail you a wordnik T-shirt!**

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

# Run the test suite
gulp test

# Build the library (minified and unminified) in the dist folder
gulp build

# continuously run the test suite:
gulp watch

# run jshint report
gulp lint

# run a coverage report
gulp cover
```

License
-------

Copyright 2011-2015 Reverb Technologies, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
