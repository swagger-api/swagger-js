(function() {

  window.context = window.describe;

  window.xcontext = window.xdescribe;

  describe('SwaggeringApi', function() {
    it("knows truth", function() {
      return expect(true).toBe(true);
    });
    describe('initialization', function() {
      describe('defaults', function() {
        beforeEach(function() {
          window.wordnik = new SwaggeringApi();
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
        it("sets the default format to JSON", function() {
          return runs(function() {
            return expect(wordnik.format).toBe('json');
          });
        });
        return it("creates an empty container for resources", function() {
          return runs(function() {
            return expect(wordnik.resources.length).toBe(0);
          });
        });
      });
      return describe('customization', function() {
        beforeEach(function() {
          window.unicornApi = new SwaggeringApi({
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
    describe('build', function() {
      beforeEach(function() {
        window.wordnik = new SwaggeringApi({
          debug: true
        });
        wordnik.build();
        return waitsFor(function() {
          return wordnik.resources.length > 0 && (wordnik.basePath != null);
        });
      });
      it("fetchs a list of resources", function() {
        return runs(function() {
          return expect(wordnik.resources.length).toBeGreaterThan(0);
        });
      });
      return it("sets basePath", function() {
        return runs(function() {
          return expect(wordnik.basePath).toBe("http://api.wordnik.com/v4");
        });
      });
    });
    return describe('descriptionUrl()', function() {
      beforeEach(function() {
        window.wordnik = new SwaggeringApi({
          debug: true
        });
        wordnik.build();
        return waitsFor(function() {
          return wordnik.resources.length > 0 && (wordnik.basePath != null);
        });
      });
      return it("replaces {format} with json", function() {
        return runs(function() {
          var resource;
          resource = wordnik.resources[0];
          return expect(resource.descriptionUrl()).toMatch(/\.json$/);
        });
      });
    });
  });

}).call(this);
