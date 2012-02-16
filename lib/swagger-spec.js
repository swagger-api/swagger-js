(function() {

  window.context = window.describe;

  window.xcontext = window.xdescribe;

  describe('Api', function() {
    describe('constructor', function() {
      describe('defaults', function() {
        beforeEach(function() {
          window.wordnik = new Api();
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
        return it("sets the default format to JSON", function() {
          return runs(function() {
            return expect(wordnik.format).toBe('json');
          });
        });
      });
      return describe('customization', function() {
        beforeEach(function() {
          window.unicornApi = new Api({
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
        window.wordnik = new Api;
        wordnik.build();
        return waitsFor(function() {
          return wordnik.isReady();
        });
      });
      it("fetchs a list of resources", function() {
        return runs(function() {
          return expect(wordnik.resources.length).toBeGreaterThan(0);
        });
      });
      it("sets basePath", function() {
        return runs(function() {
          return expect(wordnik.basePath).toBe("http://api.wordnik.com/v4");
        });
      });
      return it("creates named references to its resources", function() {
        return runs(function() {
          return expect(wordnik.words).toBeDefined();
        });
      });
    });
  });

  describe('Resource', function() {
    beforeEach(function() {
      window.wordnik = new Api();
      wordnik.build();
      return waitsFor(function() {
        return wordnik.isReady();
      });
    });
    it("has a url()", function() {
      return runs(function() {
        var resource;
        resource = wordnik.resources[0];
        return expect(resource.url()).toMatch(/\.json$/);
      });
    });
    it("has a name() method which is inferred from its path", function() {
      return runs(function() {
        var resource;
        resource = new Resource("/word.{format}", "an imaginary resource", wordnik);
        return expect(resource.name()).toEqual('word');
      });
    });
    return it("creates named references to its operations", function() {
      return runs(function() {
        var resource;
        resource = wordnik.word;
        return expect(resource.getDefinitions).toBeDefined();
      });
    });
  });

}).call(this);
