/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var test = require('unit.js');
var mock = require('./mock');
var SwaggerClient = require('..');
var Resolver = require('../lib/resolver');
var instance;

describe('swagger resolver', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      instance = server;
    });
     this.timeout(5000 * 1000);
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

  it('gracefully handles invalid remote references', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/foo': {
          get: {
            responses: {
              200: {
                description: 'a two-hundie',
                schema: {
                  $ref: 'im_not_here'
                }
              }
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8080/v2/petstore.json', function () {
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
      expect(unresolved['/definitions/Category']).toEqual(
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
      expect(unresolved['/definitionz/Category']).toEqual(
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
      expect(unresolved['/definition/Categoryzzz']).toEqual({
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

  it('resolves relative references absolute to root multiple times', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {},
      definitions: {
        Pet: {
          $ref: '/v2/relativeToRoot.json#/definitions/intermediatePet'
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/foo/bar/swagger.json', function (spec) {
      // check our double $ref unwrapped into final Pet object
      expect(spec.definitions.Pet.required).toEqual(['name', 'photoUrls']);
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


  it('resolves ref arrays in responses', function(done) {
    var api = new Resolver();
    var spec = {
      host: 'http://petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/foo': {
          get: {
            responses: {
              200: {
                description: 'Array of refs',
                schema: {
                  type: 'array',
                  items: {
                    $ref: 'http://localhost:8000/v2/models.json#/Health'
                  }
                }
              }
            }
          }
        }
      }
    };

    // should look in http://localhost:8000/foo/bar/swagger.yaml#/paths/health
    api.resolve(spec, 'http://localhost:8000/swagger.json', function (spec) {

      expect(spec.paths['/foo'].get.responses['200'].schema.items.$ref).toBe(undefined);
      expect(spec.paths['/foo'].get.responses['200'].schema.items['x-resolved-from'][0]).toBe('http://localhost:8000/v2/models.json#/Health');

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

  it('resolves a relative, nested linked reference', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/linked': {
          $ref: 'resourceWithLinkedDefinitions_part2.json'
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec, unresolved) {
      console.log(unresolved);
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

    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      expect(spec.definitions['single.json']).toExist();
      done();
    });
  });

  it('resloves absolute references', function(done) {
    var sample;
    var opts = opts || {};
    opts.url = opts.url || 'http://localhost:8000/v2/absoluteRef.json';
    opts.success = function () {
      var response = sample.apis.default.operations['get_linked'].successResponse;
      expect(response).toExist();
      expect(response['200']).toExist();
      done();
    };

    sample = new SwaggerClient(opts);
  });

  it('should resolve external references within allOf', function (done) {
    var sample;
    var opts = opts || {};
    opts.url = opts.url || 'http://localhost:8000/v2/externalRefInAllOf.json';
        
    opts.success = function () {
        var response = sample.apis.Queries.operations.getAsync.successResponse;

        expect(response).toExist();
        expect(response['200']).toExist();
           
        //JSON sample is not resolved is $ref used within allOf
        var jsonSample = response['200'].createJSONSample();
            
        expect(jsonSample).toExist();
        expect(jsonSample.response).toExist();
        expect(jsonSample.value).toExist();

        var mockSignature = response['200'].getMockSignature();
        expect(mockSignature).toExist();
        expect(mockSignature.indexOf('http://localhost:8000/v2/externalRef.json#/definitions/ErrorResponse')).toBe(-1);
        expect(mockSignature.indexOf('http://localhost:8000/v2/externalRef.json#/definitions/Order')).toBe(-1);

        done();
    };

    sample = new SwaggerClient(opts);
  });

  it('resolves absolute references per #587', function(done) {
    var sample;
    var opts = opts || {};
    opts.url = opts.url || 'http://localhost:8000/v2/test.json';
    opts.success = function () {
      expect(sample.swaggerObject.definitions).toExist();
      expect(sample.swaggerObject.definitions['error.json']).toExist();
      expect(sample.apis.Occupations.operations['post_occupations'].parameters[0].schema).toEqual(
          { '$ref': '#/definitions/error.json' });
      expect(sample.apis.Occupations.operations['post_occupations'].responses['500'].schema).toEqual(
          { '$ref': '#/definitions/error.json' }
      );
      done();
    };

    sample = new SwaggerClient(opts);
  });

  it('resolves top-level shared parameters', function(done) {
    var api = new Resolver();
    var spec = {
      parameters: {
        skip: {
          in: 'query',
          name: 'skip',
          type: 'integer',
          format: 'int32',
          required: 'true'
        }
      },
      paths: {
        '/foo': {
          get: {
            parameters: [
              { $ref: '#/parameters/skip'}
            ],
            responses: {
              200: {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      expect(spec.paths['/foo'].get.parameters[0]).toBeAn('object');
      done();
    });
  });

  it('resolves path-level shared parameters', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/foo': {
          parameters: [
            {
              in: 'query',
              name: 'skip',
              type: 'integer',
              format: 'int32',
              required: 'true'
            }
          ],
          get: {
            parameters: [
              {
                in: 'query',
                name: 'limit',
                type: 'integer',
                format: 'int32',
                required: 'true'
              }
            ],
            responses: {
              200: {
                description: 'ok'
              }
            }
          },
          post: {
            responses: {
              200: {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      var parameters = spec.paths['/foo'].get.parameters;
      expect(parameters[0].name).toEqual('skip');
      expect(parameters[1].name).toEqual('limit');
      expect(spec.paths['/foo'].parameters.length).toBe(0);


      parameters = spec.paths['/foo'].post.parameters;
      done();
    });
  });

  it('resolves shared responses', function(done) {
    var api = new Resolver();
    var spec = {
      swagger : '2.0',
      info : {
        version : '0.0.0',
        title : 'Simple API'
      },
      responses: {
        Success: {
          description: 'Success',
          schema: {
            type: 'string'
          }
        },
        Error: {
          description: 'Error',
          schema: {
            type: 'string'
          }
        }
      },
      paths : {
        '/' : {
          get : {
            parameters : [ ],
            responses : {
              200 : {
                $ref: '#/responses/Success'
              },
              default: {
                $ref: '#/responses/Error'
              }
            }
          }
        }
      },
      definitions : { }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      var responses = spec.paths['/'].get.responses;
      expect(responses['200'].description).toBe('Success');
      expect(responses['default'].description).toBe('Error');
      done();
    });
  });

  it('resolves path-level shared parameters', function(done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/foo': {
          parameters: [
            {
              in: 'query',
              name: 'skip',
              type: 'integer',
              format: 'int32',
              required: 'true'
            }
          ],
          get: {
            parameters: [
              {
                in: 'query',
                name: 'limit',
                type: 'integer',
                format: 'int32',
                required: 'true'
              }
            ],
            responses: {
              200: {
                description: 'ok'
              }
            }
          },
          post: {
            responses: {
              200: {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      var parameters = spec.paths['/foo'].get.parameters;
      expect(parameters[0].name).toEqual('skip');
      expect(parameters[1].name).toEqual('limit');
      expect(spec.paths['/foo'].parameters.length).toBe(0);

      parameters = spec.paths['/foo'].post.parameters;
      expect(parameters[0].name).toEqual('skip');
      expect(parameters.length).toEqual(1);
      done();
    });
  });

  it('resolves nested array parameters', function(done) {
    var api = new Resolver();
    var spec = {
      'swagger' : '2.0',
      'info' : {
        'version' : '0.0.0',
        'title' : 'Simple API'
      },
      'paths' : {
        '/' : {
          'post' : {
            'parameters' : [{
              in: 'body',
              name: 'myArr',
              required: true,
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    myProp: {
                      type: 'string'
                    }
                  }
                }
              }
            }],
            'responses' : {
              'default' : {
                'description': 'success'
              }
            }
          }
        }
      },
      'definitions' : { }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      expect(spec.definitions).toBeAn('object');
      expect(spec.definitions['inline_model']).toBeAn('object');
      done();
    });
  });

  it('base model properties', function(done) {
    var api = new Resolver();
    var spec = {

      swagger:'2.0',
      info:{
      },
      host:'localhost:9000',
      schemes:[
        'http'
      ],
      basePath:'/2.0',
      paths:{
        '/':{
          get:{
            responses:{
              '200':{
                description:'Pets',
                schema:{
                  '$ref':'#/definitions/Pet'
                }
              }
            },
            parameters:[
            ]
          }
        }
      },
      definitions:{
        Cat:{
          allOf: [
            {
              '$ref': '#/definitions/Pet'
            },
            {
              type: 'object',
              properties:{
                size:{
                  type: 'number'
                }
              }
            }
          ]
        },
        Pet:{
          type: 'object',
          properties:{
            color:{
              '$ref':'#/definitions/Color'
            }
          }
        },
        Color:{
          'type': 'string'
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {

      expect(spec.definitions.Pet.properties.color.$ref).toBe('#/definitions/Color');
      expect(spec.definitions.Cat.properties.color.$ref).toBe('#/definitions/Color');

      done();
    });
  });

  it('resolves allOf in response object for #681', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/':{
          get:{
            responses:{
              '200':{
                description:'Pets',
                schema:{
                  type: 'object',
                  allOf: [
                    {
                      $ref: '#/definitions/Pet'
                    },
                    {
                      $ref: '#/definitions/Tag'
                    }]
                }
              }
            },
            parameters:[]
          }
        }
      },
      definitions:{
        Tag:{
          properties:{
            size:{
              type: 'number'
            }
          }
        },
        Pet:{
          type: 'object',
          properties:{
            name:{
              type: 'string'
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/swagger.json', function (spec) {
      expect(spec.paths['/'].get.responses['200'].schema.$ref).toBeA('string');
      var model = spec.paths['/'].get.responses['200'].schema.$ref;

      var parts = model.split('\/');
      var simple = parts[parts.length - 1];

      expect(spec.definitions[simple]).toBeA('object');
      done();
    });
  });

  it('resolves remote parameters', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/':{
          get:{
            responses:{
              '200':{
                description:'thanks'
              }
            },
            parameters:[
              {
                '$ref': 'http://localhost:8000/v2/parameters.json#/query/skip'
              }
            ]
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:9000/v2/swagger.json', function (spec) {
      expect(spec.paths['/'].get.parameters[0].name).toBe('skip');
      done();
    });
  });

  it('resolves remote paths', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/': {
          '$ref': 'http://localhost:8000/v2/operations.json#/health'
        }
      }
    };
    api.resolve(spec, 'http://localhost:9000/v2/swagger.json', function (spec) {
      expect(spec.paths['/'].get).toBeAn('object');
      done();
    });
  });

  it('resolves remote responses', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/': {
          get:{
            responses:{
              '200':{
                '$ref': 'http://localhost:8000/v2/responses.json#/NotFoundError'
              }
            },
            parameters:[]
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:9000/v2/swagger.json', function (spec) {
      expect(spec.paths['/'].get.responses['200'].description).toBe('Entity not found');
      done();
    });
  });

  it('resolves remote parameters, without providing a root', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/':{
          get:{
            responses:{
              '200':{
                description:'thanks'
              }
            },
            parameters:[
              {
                '$ref': 'http://localhost:8000/v2/parameters.json#/query/skip'
              }
            ]
          }
        }
      }
    };
    api.resolve(spec, function (spec) {
      expect(spec.paths['/'].get.parameters[0].name).toBe('skip');
      done();
    });
  });

  it('resolves referenced parameters', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/':{
          post:{
            responses:{
              '200':{
                description:'thanks'
              }
            },
            parameters:[
              {
                '$ref': '#/parameters/inputParam'
              }
            ]
          }
        }
      },
      parameters: {
        inputParam: {
          in: 'body',
          name: 'theBody',
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              }
            }
          },
          required: true
        }
      }
    };
    api.resolve(spec, function (spec) {
      var param = spec.paths['/'].post.parameters[0];
      expect(param.name).toBe('theBody');
      expect(param.schema.$ref).toBeA('string');
      expect(param.schema.$ref).toEqual('#/definitions/inline_model');
      expect(spec.definitions['inline_model']).toBeAn('object');
      done();
    });
  });

  it('support model refs', function(done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Foo: {
          $ref: '#/definitions/Bar'
        },
        Bar: {
          properties: {
            name: {
              type: 'string'
            }
          }
        }
      }
    };
    api.resolve(spec, function (spec) {
      expect(spec.definitions.Foo.properties).toBeAn('object');
      expect(spec.definitions.Foo.properties.name).toBeAn('object');
      expect(spec.definitions.Foo.properties.name.type).toBe('string');
      done();
    });
  });

  it('resolves parameter with inline schema with only additionalProperties', function(done) {
    var api = new Resolver();
    var spec = {
      swagger:'2.0',
      info:{},
      host:'localhost:9000',
      basePath:'/2.0',
      paths:{
        '/':{
          post:{
            responses:{
              '200':{
                description:'thanks'
              }
            },
            parameters:[{
              in: 'body',
              name: 'myObj',
              required: true,
              schema: {
                type: 'object',
                additionalProperties: {
                  type: 'string'
                }
              }
            }]
          }
        }
      }
    };
    api.resolve(spec, function (spec) {
      var param = spec.paths['/'].post.parameters[0];
      expect(param.name).toBe('myObj');
      expect(param.schema.$ref).toBeA('string');
      expect(param.schema.$ref).toEqual('#/definitions/inline_model');
      expect(spec.definitions['inline_model']).toBeAn('object');
      done();
    });
  });
});
