/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var test = require('unit.js');
var mock = require('./mock');
var Resolver = require('../lib/resolver');
var instance;

describe('swagger resolver', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  it('is OK without remote references', function (done) {
    var api = new Resolver();
    var spec = {};

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(Object.keys(unresolvedRefs).length).toBe(0);
      done();
    });
  });

  it('resolves a remote model property reference $ref', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: { $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Category' }
          }
        }
      }
    };

    api.resolve(spec, function (spec) {
      expect(spec.definitions.Category).toExist();

      done();
    });
  });

  it('doesn\'t die on a broken remote model property reference', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: { $ref: 'http://localhost:8000/v2/petstore.jsonZZZ#/definitions/Category' }
          }
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(unresolvedRefs['http://localhost:8000/v2/petstore.jsonZZZ#/definitions/Category']).toBe(null);

      done();
    });
  });

  it('doesn\'t die on a broken remote model property reference path', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: { $ref: 'http://localhost:8000/v2/petstore.json#/definitionz/Category' }
          }
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(unresolvedRefs['http://localhost:8000/v2/petstore.json#/definitionz/Category']).toBe(null);
      done();
    });
  });

  it('doesn\'t die on a broken remote model property reference path 2', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: { $ref: 'http://localhost:8000/v2/petstore.json#/definition/Categoryzzz' }
          }
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(unresolvedRefs['http://localhost:8000/v2/petstore.json#/definition/Categoryzzz']).toBe(null);
      done();
    });
  });

  it('resolves a remote model property reference $ref in an array', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          properties: {
            category: {
              type: 'array',
              items: { $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Category' }
            }
          }
        }
      }
    };

    api.resolve(spec, function (spec) {
      expect(spec.definitions.Category).toExist();

      done();
    });
  });

  it('resolves remote parameter post object $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              in: 'body',
              name: 'body',
              required: false,
              schema: { $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Pet' }
            }]
          }
        }
      }
    };

    api.resolve(spec, function (spec) {
      expect(spec.definitions.Pet).toExist();
      done();
    });
  });

  it('resolves a remote response object $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            responses: {
              200: {
                description: 'it worked!',
                schema: { $ref: 'http://localhost:8000/v2/petstore.json#/definitions/Pet' }
              }
            }
          }
        }
      }
    };

    api.resolve(spec, function (spec) {
      expect(spec.definitions.Pet).toExist();
      expect(spec.paths['/pet'].post.responses['200'].schema.$ref).toBe('#/definitions/Pet');

      done();
    });
  });

  it('resolves a locally defined parameter $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              $ref: '#/parameters/sharedSkip'
            }]
          }
        }
      },
      parameters: {
        sharedSkip: {
          name: 'skip',
          in: 'query',
          description: 'Results to skip',
          required: false,
          type: 'integer',
          format: 'int32'
        }
      }
    };

    api.resolve(spec, function (spec) {
      var params = spec.paths['/pet'].post.parameters;

      expect(params.length).toBe(1);

      var param = params[0];

      expect(param.name).toBe('skip');

      done();
    });
  });

  it('doesn\'t puke on a malformed locally defined parameter $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              $ref: '#/parameters/sharedSkipz'
            }]
          }
        }
      },
      parameters: {
        sharedSkip: {
          name: 'skip',
          in: 'query',
          description: 'Results to skip',
          required: false,
          type: 'integer',
          format: 'int32'
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(unresolvedRefs['#/parameters/sharedSkipz']).toBe(null);

      done();
    });
  });

  it('resolves a remote defined parameter $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              $ref: 'http://localhost:8000/v2/petstore.json#/parameters/sharedSkip'
            }]
          }
        }
      },
      parameters: {
        sharedSkip: {
          name: 'skip',
          in: 'query',
          description: 'Results to skip',
          required: false,
          type: 'integer',
          format: 'int32'
        }
      }
    };

    api.resolve(spec, function (spec) {
      var params = spec.paths['/pet'].post.parameters;

      expect(params.length).toBe(1);

      var param = params[0];

      expect(param.name).toBe('skip');

      done();
    });
  });

  it('doesn\'t puke on a malformed remote defined parameter $ref', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              $ref: 'http://localhost:8000/v2/petstore.json#/parameters/sharedSkipz'
            }]
          }
        }
      },
      parameters: {
        sharedSkip: {
          name: 'skip',
          in: 'query',
          description: 'Results to skip',
          required: false,
          type: 'integer',
          format: 'int32'
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      expect(unresolvedRefs['http://localhost:8000/v2/petstore.json#/parameters/sharedSkipz']).toBe(null);

      done();
    });
  });

  it('resolves path references', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/myUsername': {
          $ref: 'http://localhost:8000/v2/petstore.json#paths/user~1{username}'
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      var path = spec.paths['/myUsername'];
      test.object(path);
      test.object(path.get);
      test.object(path.put);
      test.object(path.delete);
      done();
    });
  });

  it('resolves path references', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/myUsername': {
          $ref: 'http://localhost:8000/v2/resourceWithLinkedDefinitions_part1.json'
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      var path = spec.paths['/myUsername'];
      test.object(path);
      test.object(path.get);
      done();
    });
  });

  it('resolves nested operations with referenced models', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/health': {
          $ref: 'http://localhost:8000/v2/operations.json#health'
        }
      }
    };

    api.resolve(spec, function (spec, unresolvedRefs) {
      var health = spec.paths['/health'].get;
      test.object(health);
      test.object(spec.definitions.Health);
      test.object(spec.definitions.JVMMemory);
      done();
    });
  });

  it('should handle response references (swagger-ui/issues/1078)', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/myUsername': {
          get: {
            responses: {
              '400': {
                $ref: 'http://localhost:8000/v2/petstore.json#/responses/veryBad'
              }
            }
          }
        }
      }
    };
    api.resolve(spec, function (spec, unresolvedRefs) {
      var get = spec.paths['/myUsername'].get;
      var response = get.responses['400'];
      expect(response.description).toBe('failed');
      done();
    });
  });
});
