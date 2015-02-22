var test = require('unit.js');
var expect = require('expect');
var mock = require('../test/mock');
var swagger = require('../lib/swagger-client');
var sample, instance;

describe('swagger resolver', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    done();
  });

  it('is OK without remote references', function(done) {
    var api = new swagger.Resolver();
    var spec = {};
    api.resolve(spec, function(spec, unresolvedRefs) {
      expect(Object.keys(unresolvedRefs).length).toBe(0);
      done();
    });
  });

  it('resolves a remote model property reference $ref', function(done) {
    var api = new swagger.Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: {
              $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Category'
            }
          }
        }
      }
    };
    api.resolve(spec, function(spec, unresolvedRefs) {
      expect(spec.definitions.Category).toExist();
      done();
    });
  });

  it('resolves a remote model property reference $ref in an array', function(done) {
    var api = new swagger.Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: {
              type: 'array',
              items: {
                $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Category'
              }
            }
          }
        }
      }
    };
    api.resolve(spec, function(spec, unresolvedRefs) {
      expect(spec.definitions.Category).toExist();
      done();
    });
  });

  it('resolves remote parameter post object $ref', function(done) {
    var api = new swagger.Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              in: 'body',
              name: 'body',
              required: false,
              schema: {
                $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Pet'
              }
            }]
          }
        }
      }
    };
    api.resolve(spec, function(spec, unresolvedRefs) {
      expect(spec.definitions.Pet).toExist();
      done();
    });
  });

  it('resolves a remote response object $ref', function(done) {
    var api = new swagger.Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [],
            responses: {
              200: {
                description: 'it worked!',
                schema: {
                  $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Pet'
                }
              }
            }
          }
        }
      }
    };
    api.resolve(spec, function(spec, unresolvedRefs) {
      expect(spec.definitions.Pet).toExist();
      expect(spec.paths['/pet'].post.responses['200'].schema.$ref).toBe('#/definitions/Pet');
      done();
    });
  });
});