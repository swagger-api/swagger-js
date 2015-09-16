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

    api.resolve(spec, function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
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

    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
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

    api.resolve(spec, function (spec, unresolved) {
      expect(unresolved['http://localhost:8000/v2/petstore.jsonZZZ#/definitions/Category']).toEqual(
        {
          root: 'http://localhost:8000/v2/petstore.jsonZZZ',
          location: '/definitions/Category'
        }
      );
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

    api.resolve(spec, function (spec, unresolved) {
      expect(unresolved['http://localhost:8000/v2/petstore.json#/definitionz/Category']).toEqual(
        {
          root: 'http://localhost:8000/v2/petstore.json',
          location: '/definitionz/Category'
        }
      );
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

    api.resolve(spec, function (spec, unresolved) {
      expect(unresolved['http://localhost:8000/v2/petstore.json#/definition/Categoryzzz']).toEqual({
        root: 'http://localhost:8000/v2/petstore.json',
        location: '/definition/Categoryzzz'
      });
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

    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(unresolved['#/parameters/sharedSkipz']).toEqual({
        root: 'http://localhost:8000/v2/petstore.json',
        location: '/parameters/sharedSkipz' });
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

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(unresolved['http://localhost:8000/v2/petstore.json#/parameters/sharedSkipz']).toEqual({
        root: 'http://localhost:8000/v2/petstore.json',
        location: '/parameters/sharedSkipz'
      });
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

    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
      var path = spec.paths['/myUsername'];
      test.object(path);
      test.object(path.get);
      test.object(path.put);
      test.object(path.delete);
      done();
    });
  });

  it('resolves path references 2', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/myUsername': {
          $ref: 'http://localhost:8000/v2/resourceWithLinkedDefinitions_part1.json'
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
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

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
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
    // we use a different URL so the resolver doesn't treat the `spec` as the *entire* spec.
    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function (spec) {
      var get = spec.paths['/myUsername'].get;
      var response = get.responses['400'];
      expect(response.description).toBe('failed');
      done();
    });
  });

  it('resolves relative references absolute to root', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          get: {
            parameters: [],
            responses: {
              default: { description: 'ok' }
            }
          }
        }
      },
      definitions: {
        Pet: {
          properties: {
            id: { $ref: '/v2/petstore.json#/definitions/Pet' }
          }
        }
      }
    };

    // should look in http://localhost:8000/v2/petstore.json#/definitions/Category
    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec) {
      var health = spec.paths['/health'];
      test.object(health);
      done();
    });
  });

  it('resolves relative references relative to reference', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          get: {
            parameters: [],
            responses: {
              default: { description: 'ok' }
            }
          }
        }
      },
      definitions: {
        Pet: {
          properties: {
            id: { $ref: 'Category' }
          }
        }
      }
    };

    // should look in http://localhost:8000/v2/petstore.json#/definitions/Category
    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec) {
      var health = spec.paths['/health'];
      test.object(health);
      done();
    });
  });

  it('resolves relative references relative to reference 2', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          get: {
            parameters: [],
            responses: {
              default: { description: 'ok' }
            }
          }
        }
      },
      definitions: {
        Pet: {
          properties: {
            id: { $ref: '../common/Address.json#/definitions/Pet' }
          }
        }
      }
    };

    // should look in http://localhost:8000/v2/petstore.json#/definitions/Category
    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec) {
      var health = spec.paths['/health'];
      test.object(health);
      done();
    });
  });

  it('resolves relative references', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: 'Category'
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.json#/paths/health
    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec, unresolved) {
      expect(unresolved.Category).toExist();
      var health = spec.paths['/health'];
      test.object(health);
      done();
    });
  });

  it('resolves a remote response object $ref without root', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            responses: {
              200: {
                $ref: '#/responses/200'
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'successful operation',
          schema: {
            $ref: '#/definitions/Pet'
          }
        }
      },
      definitions: {
        Pet: {
          properties: {
            type: 'integer',
            format: 'int32'
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

  it('detects unresolved relative references from a peer file', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: 'definitions.yaml#/MyResource'
        }
      }
    };

    // should look in http://localhost:8080/foo/bar/definitions.yaml#/MyResource
    api.resolve(spec, 'http://localhost:8080/foo/bar/swagger.json', function (spec, unresolved) {
      expect(unresolved['definitions.yaml#/MyResource']).toEqual({
        root: 'http://localhost:8080/foo/bar/definitions.yaml',
        location: '/MyResource'
      });
      done();
    });
  });

  it('detects relative references from a peer file', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: 'models.json#/Health'
        }
      }
    };

    // should find `Health` in http://localhost:8080/v2/models.json#/Health
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      done();
    });
  });

  it('detects relative references without anchor', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: 'single.json'
        }
      }
    };

    // should find `Health` in http://localhost:8080/v2/models.json#/Health
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      done();
    });
  });

  it('resolves relative references from a sub-folder/file', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: '/specific-domain/definitions.yaml#/MyResource'
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.json#/paths/health
    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec, unresolved) {
      expect(unresolved['/specific-domain/definitions.yaml#/MyResource']).toEqual({
        root: 'http://localhost:8000/specific-domain/definitions.yaml',
        location: '/MyResource'
      });
      done();
    });
  });

  it('resolves relative references from a parent folder/file', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: '../json/definitions.json#/ApiError'
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.json#/paths/health
    api.resolve(spec, 'http://localhost:8000/common/bar/swagger.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(2);
      test.object(spec.paths['/health'].get);
      done();
    });
  });

  it('resolves relative references from a yaml folder/file', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: '../yaml/definitions.yaml#/ApiError'
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.yaml#/paths/health
    api.resolve(spec, 'http://localhost:8000/common/bar/swagger.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec.paths['/health'].get);
      done();
    });
  });

  it('resolves multiple path refs', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/health': {
          $ref: 'http://localhost:8000/v2/operations.json#/health'
        },
        '/users': {
          get: {
            tags: [
              'users'
            ],
            summary: 'Returns users in the system',
            operationId: 'getUsers',
            produces: [
              'application/json'
            ],
            parameters: [
              {
                $ref: 'http://localhost:8000/v2/parameters.json#/query/skip'
              },
              {
                $ref: 'http://localhost:8000/v2/parameters.json#/query/limit'
              }
            ],
            responses: {
              200: {
                description: 'Users in the system',
                schema: {
                  type: 'array',
                  items: {
                    $ref: 'http://localhost:8000/v2/models.json#/Health'
                  }
                }
              },
              404: {
                $ref: 'http://localhost:8000/v2/responses.json#/NotFoundError'
              }
            }
          }
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.yaml#/paths/health
    api.resolve(spec, 'http://localhost:8000/swagger.json', function (spec, unresolved) {
      expect(spec.paths['/users'].get.parameters.length).toBe(2);
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec.paths['/health'].get);
      done();
    });
  });

  it('does not make multiple calls for parameter refs #489', function(done) {
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

    api.resolve(spec, 'http://localhost:8000/swagger.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      done();
    });
  });

  it('resolves an local ref per #573', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/pet': {
          post: {
            parameters: [{
              in: 'body',
              name: 'body',
              required: true,
              schema: {
                $ref: 'models.json#/Parent'
              }
            }]
          }
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      expect(spec.definitions.Parent).toExist();
      expect(spec.definitions.Parent.properties.child.$ref).toEqual('#/definitions/Child');
      expect(Object.keys(unresolved).length).toBe(0);
      expect(spec.definitions.Child).toExist();
      done();
    });
  });

  it('resolves a linked reference', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/linked': {
          $ref: 'resourceWithLinkedDefinitions_part1.json'
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      expect(spec.definitions.Pet).toExist();
      expect(spec.definitions.ErrorModel).toExist();
      expect(Object.keys(unresolved).length).toBe(0);
      done();
    });
  });

  it('resolves a linked reference', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/linked': {
          get: {
            parameters: [
              {
                name: 'status',
                in: 'query',
                description: 'Status values that need to be considered for filter',
                required: false,
                type: 'string'
              }
            ],
            responses: {
              200: {
                description: 'successful operation',
                schema: {
                  $ref: 'single.json'
                }
              },
              400: {
                description: 'Invalid status value'
              }
            }
          }
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      expect(spec.definitions['single.json']).toExist();
      done();
    });
  });
});
