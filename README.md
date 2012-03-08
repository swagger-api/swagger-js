swagger.js
==========

swagger.js is a javascript client for use with [swagger](http://swagger.wordnik.com)ing APIs.

Find out more about the swagger project at [swagger.wordnik.com](http://swagger.wordnik.com), 
and follow us on Twitter at [@swagger_doc](https://twitter.com/#!/swagger_doc).

Usage
-----

Point swagger.js at a resource discovery file like
[api.wordnik.com/v4/resources.json](http://api.wordnik.com/v4/resources.json)
and it builds itself at runtime.

```html
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script type="text/javascript" src="swagger.js"></script>
<script type="text/javascript">
  $(function() { 
    window.wordnik = new Api({
      discoveryUrl: "http://api.wordnik.com/v4/resources.json",
      apiKey: "MY_API_KEY",
      success: function() {
        alert('Shall we dance?');
      }
    });
  });
</script>
```

### Debugging

If you set `verbose` to `true` when initializing your client, you'll see `curl`
equivalents of all your requests in the browser console.

```javascript
wordnik = new Api({
  discoveryUrl: 'http://api.wordnik.com/v4/resources.json',
  api_key: 'b39ee8d5f05d0f566a0080b4c310ceddf5dc5f7606a616f53',
  verbose: true,
  success: function() {
    wordnik.word.getDefinitions.do({word: 'dog'}, function(definitions){
      console.log(definitions[0].word);
      for (var i = 0; i < definitions.length; i++) {
        var definition = definitions[i];
        console.log(definition.partOfSpeech + ": " + definition.text);
      }
    });
  }
});

// Console output:
// curl http://api.wordnik.com/v4/word.json/dog/definitions?api_key=YOUR_API_KEY
// dog
// noun: A domesticated carnivorous mammal (Canis familiaris) related to the foxes and wolves and raised in a wide variety of breeds.
// noun: Any of various carnivorous mammals of the family Canidae, such as the dingo.
// noun: A male animal of the family Canidae, especially of the fox or a domesticated breed.
// etc...
```

Development
-----------

**Send us a pull request and we'll send you a wordnik tee shirt!**

Please [fork the code](https://github.com/wordnik/swagger.js) and help us make 
swagger better. Swagger.js is written in CoffeeScript, so you'll need the 
CoffeeScript compiler. To install it, check out 
[coffeescript.org/#installation](http://coffeescript.org/#installation)

```bash
# Watch the /src dir for changes and autocompile them to /lib
coffee -o lib/ -cw src/
```

```bash
# Run the test suite
open spec.html
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