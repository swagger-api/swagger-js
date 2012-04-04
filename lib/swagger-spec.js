(function() {

  window.api_key = 'a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5';

  describe('SwaggerApi', function() {
    describe('constructor', function() {
      describe('defaults', function() {
        beforeEach(function() {
          window.wordnik = new SwaggerApi;
          return waitsFor(function() {
            return wordnik;
          });
        });
        it("sets the default discoveryUrl to wordnik's production API", function() {
          return runs(function() {
            return expect(wordnik.discoveryUrl).toBe("http://api.wordnik.com/v4/resources.json");
          });
        });
        it("disables the debugger by default", function() {
          return runs(function() {
            return expect(wordnik.debug).toBe(false);
          });
        });
        return it("builds right away if a 'success' callback was passed to the initializer", function() {
          window.successFunctionCalled = false;
          window.sampleApi = new SwaggerApi({
            success: function() {
              return window.successFunctionCalled = true;
            }
          });
          waitsFor(function() {
            return sampleApi.ready != null;
          });
          return runs(function() {
            return expect(window.successFunctionCalled).toBe(true);
          });
        });
      });
      return describe('customization', function() {
        beforeEach(function() {
          window.unicornApi = new SwaggerApi({
            discoveryUrl: "http://unicorns.com",
            debug: true,
            apiKey: 'stardust'
          });
          return waitsFor(function() {
            return unicornApi;
          });
        });
        it("allows discoveryUrl to be set", function() {
          return runs(function() {
            return expect(unicornApi.discoveryUrl).toBe("http://unicorns.com");
          });
        });
        it("allows debugging to be enabled", function() {
          return runs(function() {
            return expect(unicornApi.debug).toBe(true);
          });
        });
        return it("converts apiKey to api_key", function() {
          return runs(function() {
            return expect(unicornApi.api_key).toBe('stardust');
          });
        });
      });
    });
    return describe('build', function() {
      beforeEach(function() {
        window.wordnik = new SwaggerApi;
        wordnik.build();
        return waitsFor(function() {
          return wordnik.ready != null;
        });
      });
      it("sets basePath", function() {
        return runs(function() {
          return expect(wordnik.basePath).toBe("http://api.wordnik.com/v4");
        });
      });
      it("creates a container object for its resources, with resource names as keys", function() {
        return runs(function() {
          expect(wordnik.resources).toBeDefined();
          return expect(wordnik.resources.word).toBeDefined();
        });
      });
      return it("creates shorthand references to its resources", function() {
        return runs(function() {
          return expect(wordnik.words).toBeDefined();
        });
      });
    });
  });

  describe('SwaggerResource', function() {
    beforeEach(function() {
      window.wordnik = new SwaggerApi;
      wordnik.build();
      return waitsFor(function() {
        return wordnik.ready != null;
      });
    });
    it("creates a url property", function() {
      return runs(function() {
        var resource;
        resource = wordnik.resources.wordList;
        return expect(resource.url).toMatch(/\.json$/);
      });
    });
    it("has a name property which is inferred from its path", function() {
      return runs(function() {
        var resource;
        resource = wordnik.word;
        return expect(resource.name).toEqual('word');
      });
    });
    it("creates a container object for its operations, with operation nicknames as keys", function() {
      return runs(function() {
        var resource;
        resource = wordnik.word;
        expect(resource.operations).toBeDefined();
        return expect(resource.operations.getExamples).toBeDefined();
      });
    });
    return it("creates named functions that map to its operations", function() {
      return runs(function() {
        return expect(wordnik.word.getDefinitions).toBeDefined();
      });
    });
  });

  describe('SwaggerOperation', function() {
    beforeEach(function() {
      window.wordnik = new SwaggerApi;
      wordnik.api_key = window.api_key;
      wordnik.build();
      return waitsFor(function() {
        return wordnik.ready != null;
      });
    });
    describe("urlify", function() {
      beforeEach(function() {
        window.operation = wordnik.resources.word.operations.getDefinitions;
        operation.path = "/my.{format}/{foo}/kaboo";
        operation.parameters = [
          {
            paramType: 'path',
            name: 'foo'
          }
        ];
        return window.args = {
          foo: 'pee'
        };
      });
      it("automatically converts {format} to json", function() {
        return runs(function() {
          return expect(operation.urlify(args)).toMatch(/my\.json/);
        });
      });
      it("injects path arguments into the path", function() {
        return runs(function() {
          return expect(operation.urlify(args)).toMatch(/\/pee\/kaboo/);
        });
      });
      return it("throws an exception if path has unmatched arguments", function() {
        return runs(function() {
          var args;
          args = {};
          return expect(function() {
            return operation.urlify(args);
          }).toThrow("foo is a required path param.");
        });
      });
    });
    return describe("do", function() {
      beforeEach(function() {
        window.args = {
          word: 'flagrant',
          limit: 3
        };
        return window.response = null;
      });
      it("gets back an array of definitions", function() {
        wordnik.word.getDefinitions(args, function(response) {
          return window.response = response;
        });
        waitsFor(function() {
          return typeof response !== "undefined" && response !== null;
        });
        return runs(function() {
          expect(response.length).toBeGreaterThan(0);
          expect(response[0].word).toBeDefined();
          expect(response[0].text).toBeDefined();
          return expect(response[0].partOfSpeech).toBeDefined();
        });
      });
      it("pulls request headers out of the args object", function() {
        args.headers = {
          'head-cheese': 'certainly'
        };
        window.request = wordnik.word.getDefinitions(args, function(response) {
          return window.response = response;
        });
        waitsFor(function() {
          return typeof response !== "undefined" && response !== null;
        });
        return runs(function() {
          expect(request.headers).toBeDefined();
          return expect(request.headers['head-cheese']).toBeDefined();
        });
      });
      return it("pulls request body out of the args object", function() {
        args.body = {
          'name': 'haute couture',
          'pronunciation': 'hottie cooter-otty'
        };
        window.request = wordnik.word.getDefinitions(args, function(response) {
          return window.response = response;
        });
        waitsFor(function() {
          return typeof response !== "undefined" && response !== null;
        });
        return runs(function() {
          expect(request.body).toBeDefined();
          expect(request.body.name).toMatch(/haute/);
          return expect(request.body.pronunciation).toMatch(/cooter/);
        });
      });
    });
  });

  describe('SwaggerRequest', function() {
    beforeEach(function() {
      window.wordnik2 = new SwaggerApi;
      wordnik2.api_key = 'magic';
      wordnik2.build();
      return waitsFor(function() {
        return wordnik2.ready != null;
      });
    });
    describe("constructor", function() {
      beforeEach(function() {
        var body, callback, error, headers, operation;
        headers = {
          'mock': 'true'
        };
        body = null;
        callback = function() {
          return 'mock callback';
        };
        error = function() {
          return 'mock error';
        };
        operation = wordnik2.word.operations.getExamples;
        return window.request = new SwaggerRequest("GET", "http://google.com", headers, body, callback, error, operation);
      });
      return it("sticks the API key into the headers, if present in the parent Api configuration", function() {
        return runs(function() {
          return expect(request.headers.api_key).toMatch(/magic/);
        });
      });
    });
    it("exposes an asCurl() method", function() {
      var curl;
      curl = request.asCurl();
      return expect(curl).toMatch(/curl --header \"mock: true\" --header \"api_key: magic\"/);
    });
    return it("supports POST requests", function() {
      window.petstore = new SwaggerApi({
        discoveryUrl: "http://chorus-dev.nik.io/api/resources.json",
        success: function() {
          var userParts;
          window.random = Math.floor(Math.random() * 1000000);
          userParts = {
            username: "kareem" + random,
            email: "kareem" + random + "@abdul-jabbar.com",
            password: "thunderbolt"
          };
          return petstore.users.register({
            body: userParts
          }, function(response) {
            return window.user = response;
          });
        }
      });
      waitsFor(function() {
        return window.user != null;
      });
      return runs(function() {
        return expect(window.user.username).toBe("kareem" + random);
      });
    });
  });

}).call(this);
