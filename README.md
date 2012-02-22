swagger.js
==========

swagger.js is a javascript wrapper for Swagger-compliant APIs. It is completely standalone,
with no dependencies on jQuery or any other library.

Find out more about the Swagger project at [swagger.wordnik.com](http://swagger.wordnik.com), 
and follow us on Twitter at [@swagger_doc](https://twitter.com/#!/swagger_doc).

Usage
-----

```html
<script type="text/javascript" src="swagger.js"></script>
<script type="text/javascript">
  wordnik = new SwaggeringApi({
    discoveryUrl: "http://api.wordnik.com/v4/resources.json",
    apiKey: "MY_API_KEY",
    success: function() { alert('Shall we dance?'); }
  });
</script>
```

Development
-----------

1. [Fork.](https://github.com/wordnik/swagger.js)
1. Hack. (Add tests)
1. Submit a pull request.

The only development dependency is the CoffeeScript compiler. To install it, 
check out [coffeescript.org/#installation](http://coffeescript.org/#installation)

```bash
# Watch the /src dir for changes and autocompile them to /lib
coffee -o lib/ -cw src/
coffee -cj lib/swagger.js src/swagger.coffee src/reqwest.coffee
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
You may obtain a copy of the License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.