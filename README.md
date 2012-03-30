swagger.js
==========

swagger.js is a javascript client for use with [swagger](http://swagger.wordnik.com)ing APIs.
It's written in CoffeeScript and tested with Jasmine.

Find out more about the swagger project at [swagger.wordnik.com](http://swagger.wordnik.com), 
and follow us on Twitter at [@swagger_doc](https://twitter.com/#!/swagger_doc).

Usage
-----

Point swagger.js at a resource discovery file like
[api.wordnik.com/v4/resources.json](http://api.wordnik.com/v4/resources.json)
and it builds itself at runtime.

```html
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script type="text/javascript" src="https://raw.github.com/wordnik/swagger.js/master/lib/swagger.js"></script>
<script type="text/javascript">
  $(function() { 
    window.wordnik = new SwaggerApi({
      discoveryUrl: "http://api.wordnik.com/v4/resources.json",
      apiKey: "MY_API_KEY",
      success: function() {
        console.log('Shall we dance?');
      }
    });
  });
</script>
```

How it Works
------------

1. [Fork the repo](https://github.com/wordnik/swagger.js).
1. Clone it.
1. Open `spec.html` in your browser.
1. Follow along in the Javascript console.

### Initialization

```javascript
wordnik = new SwaggerApi({
  api_key: 'YOUR_API_KEY', // Don't have a Wordnik API key? Get one at developer.wordnik.com
  verbose: true,
  success: function() { console.log("Your client is ready to swagger."); }
});
```

When initializing a swagger.js SwaggerApi class, the default discoveryUrl is 
[http://api.wordnik.com/v4/resources.json](http://api.wordnik.com/v4/resources.json), 
so we skipped it above.

After executing the above code you should see the success message in your console.

### Object Hierarchy

Now you have access to an object called `wordnik`.
This object is what swagger.js builds at runtime when you
point it at a `discoveryUrl`. Try exploring it in the console:

```javascript
wordnik
wordnik.resources
wordnik.resources.word.operations
wordnik.resources.word.operations.getDefinition
```

### Quick Reference

You also get some console help() methods for quick reference. Some examples:

```javascript
// Apis
wordnik.help()

// Resources
wordnik.resource.word.help()

// Operations
wordnik.resources.word.operations.getExamples.help()
```
### Making Requests

There are two ways to make a request:

```javascript
// shorthand form
wordnik.word.getDefinitions(args, callback);

// longhand form
wordnik.resources.word.operations.getDefinitions.do(args, callback);

// example usage
wordnik.word.getDefinitions({word: 'bliss'}, function(definitions) {
  console.log(definitions);
})
```

### Request Headers

You can include your own headers in the args object:

```javascript
args = {word: 'swole', limit:5}
args.headers = {magic: 'potion'}
callback = function(examples) { console.log(examples); }
wordnik.word.getExamples(args, callback);
```

If you want to initialize the Request without actually firing 
off a network request you can set a header called `mock` with any value.

### Request Body

For GETs and POSTs, you can include the request body in the args object:

```javascript
args = {}
args.body = {name: "gizmo", description: "A thing that does stuff."}
callback = function(thing) { console.log(thing); }
myApi.things.createThing(args, callback);
```

### Debugging / cURL

Set `verbose` to `true` when initializing your client to see cURL
equivalents of your requests in the browser console, complete with headers:

```javascript
wordnik = new SwaggerApi({
  api_key: 'YOUR_API_KEY',
  verbose: true,
  success: function() {
    args = {
      word: 'dog'
      headers: {fubar: 'maybe'}
    }
    wordnik.word.getDefinitions.do(args, function(definitions){
      console.log(definitions[0].word);
      for (var i = 0; i < definitions.length; i++) {
        var definition = definitions[i];
        console.log(definition.partOfSpeech + ": " + definition.text);
      }
    });
  }
});

// Console output:
// curl --header "fubar: maybe" http://api.wordnik.com/v4/word.json/dog/definitions?api_key=YOUR_API_KEY
// dog
// noun: A domesticated carnivorous mammal (Canis familiaris) related to the foxes and wolves and raised in a wide variety of breeds.
// noun: Any of various carnivorous mammals of the family Canidae, such as the dingo.
// noun: A male animal of the family Canidae, especially of the fox or a domesticated breed.
// etc...
```

Development
-----------

Please [fork the code](https://github.com/wordnik/swagger.js) and help us improve 
swagger.js. Send us a pull request and **we'll mail you a wordnik T-shirt!**

Swagger.js is written in CoffeeScript, so you'll need Node.js and the 
CoffeeScript compiler. For more detailed installation instructions, see 
[coffeescript.org/#installation](http://coffeescript.org/#installation).

```bash
open http://nodejs.org/#download 
npm install -g coffee-script
```

```bash
# The 'dev' cake task will:
# 1. Open source files in your $EDITOR
# 2. Open and run the Jasmine specs in your browser.
# 3. Watch for changes to CoffeeScript files and auto-compile them to Javascript.
cake dev

# List all cake tasks:
cake
```

License
-------

Copyright 2011-2012 Wordnik, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at 
[apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.