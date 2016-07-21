/* global describe, it */

'use strict';

var _ = require('lodash-compat');
var expect = require('expect');
var petstoreRaw = require('./spec/v2/petstore.json');
var SwaggerClient = require('..');
var auth = require('../lib/auth');

/* jshint ignore:start */
var mock = require('./mock');
var instance;
/* jshint ignore:end */

describe('SwaggerClient', function () {
  /* jshint ignore:start */
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  /* jshint ignore:end */
  it('ensure externalDocs is attached to the client when available (Issue 276)', function (done) {
    var client = new SwaggerClient({
      spec: petstoreRaw,
      success: function () {
        expect(client.externalDocs).toEqual(petstoreRaw.externalDocs);

        done();
      }
    });
  });

  describe('enabling promises', function() {

    var client;

    describe('given a valid spec (or url)', function() {
      beforeEach(function() {
        client = new SwaggerClient({
          spec: petstoreRaw,
          usePromise: true
        });
      });

      it('should resolve with an object as response', function(done) {
        client.then(function(response) {
          expect(response).toNotBe(null);
          done();
        });
      });

      it('should set the client to be ready', function(done) {
        client.then(function(response) {
          expect(response.ready).toBe(true);
          done();
        });
      });
    });

  });

  describe('Runtime Support', function() {
    describe('IE 8', function() {

      it('String#trim', function() {
        expect(typeof String.prototype.trim).toBe('function');
        expect('  hi  '.trim()).toBe('hi');
      });

      it('Array#indexOf', function() {
        expect(typeof Array.prototype.indexOf).toBe('function');
        expect(['1', '2'].indexOf('2')).toBe(1);
        expect(['1', '2'].indexOf('3')).toBe(-1);
      });
    });

    describe('Node 0.10.x', function() {
      it('String#endsWith', function() {
        expect(typeof String.prototype.endsWith).toBe('function');
        expect('hello'.endsWith('lo')).toBe(true);
        expect('hello'.endsWith('he')).toBe(false);
      });
    });
  });

  it('ensure reserved tag names are handled properly (Issue 209)', function (done) {
    var cPetStore = _.cloneDeep(petstoreRaw);

    cPetStore.tags[1].name = 'help';
    // see https://github.com/swagger-api/swagger-ui/issues/1615
    cPetStore.tags.push({ name: 'title' });

    _.forEach(cPetStore.paths, function (path) {
      _.forEach(path, function (operation) {
        _.forEach(operation.tags, function (tag, index) {
          if (tag === 'user') {
            operation.tags[index] = 'help';
          }
        });
        // see https://github.com/swagger-api/swagger-ui/issues/1615
        operation.tags.push('title');
      });
    });

    var client = new SwaggerClient({
      spec: cPetStore,
      success: function () {
        expect(client.help).toBeA('function');
        expect(client.apis.help).toBeA('function');
        expect(client.pet.help).toBeA('function');
        expect(client._help.help).toBeA('function');

        expect(client.title).toBeA('string');
        expect(client._title.help).toBeA('function');

        expect(Object.keys(client.pet)).toEqual(Object.keys(client.apis.pet));
        expect(client._help).toEqual(client.apis._help);

        expect(client.help(true).indexOf('_help')).toBeMoreThan(-1);
        expect(client.apis.help(true).indexOf('_help')).toBeMoreThan(-1);
        expect(client._help.help(true).indexOf('_help')).toBeMoreThan(-1);
        expect(client.apis._help.help(true).indexOf('_help')).toBeMoreThan(-1);

        done();
      }
    });
  });

  it('ensure reserved operation names are handled properly (Issue 209)', function (done) {
    var cPetStore = _.cloneDeep(petstoreRaw);

    cPetStore.paths['/pet/add'].post.operationId = 'help';

    var client = new SwaggerClient({
      spec: cPetStore,
      success: function () {
        expect(client.pet.help).toBeA('function');
        expect(client.pet._help).toBeA('function');

        expect(client.help(true).indexOf('_help')).toBeMoreThan(-1);
        expect(client.pet.help(true).indexOf('_help')).toBeMoreThan(-1);
        expect(client.pet._help.help(true).indexOf('_help')).toBeMoreThan(-1);

        done();
      }
    });
  });

  it('should handle empty tags (Issue 291)', function (done) {
    var cPetStore = _.cloneDeep(petstoreRaw);

    cPetStore.paths['/pet/add'].post.tags = [];

    var client = new SwaggerClient({
      spec: cPetStore,
      success: function () {
        expect(client.default.help).toBeA('function');
        expect(client.default.createPet).toBeA('function');

        done();
      }
    });
  });

  it('should handle \'/apis\' path (Issue 291)', function (done) {
    var cPetStore = _.cloneDeep(petstoreRaw);

    cPetStore.paths['/apis'] = _.cloneDeep(petstoreRaw.paths['/pet']);

    _.forEach(cPetStore.paths['/pet'], function (operation) {
      operation.tags = ['apis'];
    });

    var client = new SwaggerClient({
      spec: cPetStore,
      success: function () {
        expect(client.apis._apis.help).toBeA('function');
        expect(client.apis._apis.addPet).toBeA('function');
        expect(client.apis._apis.updatePet).toBeA('function');

        done();
      }
    });
  });

  it('should read an object from #404 and include the URL', function(done) {
    var spec = {
      swagger : '2.0',
      info : {
        description : '...',
        title : 'API',
        version : '1'
      },
      'scheme': ['http'],
      'host': 'localhost:8080',
      basePath : '/x',
      paths : {
        '/test' : {
          post : {
            responses : {
              200 : {
                description : 'Success',
                schema : {
                  $ref : '#/definitions/Object'
                }
              }
            }
          }
        }
      },
      definitions : {
        Object : {
          properties : {
            link : {
              title : 'Links',
              'schema': {
                $ref : 'TODO'
              },
              type : 'object'
            }
          },
          type : 'object'
        }
      }
    };

    var client = new SwaggerClient({
      spec: spec,
      success: function () {
        expect(client.host).toBe('localhost:8080');
        done();
      }
    });
  });

  it('should read an object from #404', function(done) {
    var spec = {
      swagger : '2.0',
      info : {
        description : '...',
        title : 'API',
        version : '1'
      },
      'scheme': ['http'],
      'host': 'localhost:8080',
      basePath : '/x',
      paths : {
        '/test' : {
          post : {
            tags: [ 'fun' ],
            operationId: 'tryIt',
            summary: 'it is just a test',
            responses : {
              200 : {
                description : 'Success',
                schema : {
                  $ref : '#/definitions/Object'
                }
              }
            }
          }
        }
      },
      definitions : {
        Object : {
          properties : {
            link : {
              title : 'Links',
              'schema': {
                $ref : 'TODO'
              },
              type : 'object'
            }
          },
          type : 'object'
        }
      }
    };

    var client = new SwaggerClient({
      spec: spec,
      success: function () {
        client.fun.tryIt.help();
        done();
      }
    });
  });

  it('should use jQuery', function(done) {
    var client = new SwaggerClient({
      spec: petstoreRaw,
      useJQuery: true,
      success: function () {
        var result = client.pet.getPetById({petId: 3}, { mock: true });
        expect(result.useJQuery).toBe(true);
        done();
      }
    });
  });

  it('should use jqueryAjaxCache', function(done) {
    var client = new SwaggerClient({
      spec: petstoreRaw,
      jqueryAjaxCache: true,
      success: function () {
        var result = client.pet.getPetById({petId: 3}, { mock: true });
        expect(result.jqueryAjaxCache).toBe(true);
        done();
      }
    });
  });

  it('should force jQuery for options', function(done) {
    var spec = {
      swagger: '2.0',
      info: {
        description: 'This is a sample server Petstore server',
        version: '1.0.0',
        title: 'Swagger Petstore'
      },
      host: 'petstore.swagger.io',
      basePath: '/v2',
      paths: {
        '/pet': {
          options: {
            tags: [ 'pet' ],
            operationId: 'testOptions',
            responses: {
              200: {
                description: 'OK'
              }
            }
          }
        }
      }
    };

    new SwaggerClient({
      spec: spec,
      usePromise: true
    }).then(function (client) {
      client.pet.testOptions()
        .then(function () {
          done();
        });
    })
    .catch (function () {
      // this is expected
      done();
    });
  });

  it('should should use a custom http client', function(done) {
    var myHttpClient = {
      execute: function(obj) {
        obj.on.response('ok');
      }
    };

    var client = new SwaggerClient({
      spec: petstoreRaw,
      client: myHttpClient,
      success: function () {
        client.pet.getPetById({petId: 3}, function(data){
          expect(data).toBe('ok');
          done();
        });
      }
    });
  });

  it('should use a responseInterceptor', function(done) {
    var responseInterceptor = {
      apply: function(data) {
        data.url = 'foo/bar';
        return data;
      }
    };

    var client = new SwaggerClient({
      spec: petstoreRaw,
      responseInterceptor: responseInterceptor,
      success: function () {
        client.pet.getPetById({petId: 1}, function(data){
          expect(data.url).toBe('foo/bar');
          done();
        });
      }
    });
  });

  it('should use a responseInterceptor with errors', function(done) {
    var responseInterceptor = {
      apply: function(data) {
        expect(data.status).toBe(400);
        data.statusText = 'bad!';
        return data;
      }
    };

    var client = new SwaggerClient({
      spec: petstoreRaw,
      responseInterceptor: responseInterceptor,
      success: function () {
        client.pet.getPetById({petId: 666}, function(){
          done('it failed');
        },
        function(data) {
          expect(data.statusText).toBe('bad!');
          done();
        });
      }
    });
  });

  it('should use a responseInterceptor with no error handler', function(done) {
    var responseInterceptor = {
      apply: function(data) {
        expect(data.status).toBe(400);
        done();
        return data;
      }
    };

    var client = new SwaggerClient({
      spec: petstoreRaw,
      responseInterceptor: responseInterceptor,
      success: function () {
        client.pet.getPetById({petId: 666}, function(){
          done('it failed');
        });
      }
    });
  });

  it('should properly parse an array property', function(done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            operationId: 'myop',
            tags: [
                'test'
            ],
            parameters: [
              {
                in: 'query',
                name: 'username',
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'a','b'
                  ]
                }
              }
            ]
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://example.com/petstore.yaml',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var param = client.test.apis.myop.parameters[0];
      expect(param.enum).toBe(undefined);
      expect(param.items.enum).toEqual(['a', 'b']);
      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('tests https://github.com/swagger-api/swagger-js/issues/535', function(done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            tags: [ 'foo' ],
            operationId: 'test',
            parameters: [
              {
                in: 'body',
                name: 'body',
                schema: { $ref: '#/definitions/ModelA' }
              }
            ]
          }
        }
      },
      definitions: {
        ModelA: {
          required: [ 'modelB' ],
          properties: {
            modelB: { $ref: '#/definitions/ModelB' }
          }
        },
        ModelB: {
          required: [ 'property1', 'property2' ],
          properties: {
            property1: { type: 'string', enum: ['a','b'] },
            property2: { type: 'string' }
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://example.com/petstore.yaml',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var param = client.foo.apis.test.parameters[0];
      var modelA = JSON.parse(param.sampleJSON);
      expect(modelA).toBeAn('object');
      expect(modelA.modelB).toBeAn('object');

      var modelB = client.models.ModelB;
      expect(modelB).toBeAn('object');
      expect(modelB.definition.properties.property1).toBeAn('object');
      expect(modelB.definition.properties.property2).toBeAn('object');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('creates unique operationIds per #595', function(done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            operationId: 'test',
            parameters: [],
            responses: {
              'default': {
                description: 'success'
              }
            }
          }
        },
        '/bar': {
          get: {
            operationId: 'test',
            parameters: [],
            responses: {
              'default': {
                description: 'success'
              }
            }
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://example.com/petstore.yaml',
      spec: spec,
      usePromise: true
    }).then(function (client) {
      expect(client.default.test).toBeA('function');
      expect(client.default.test_0).toBeAn('function');
      done();
    }).catch(function (exception) {
      done(exception);
    });
  });

  it('applies both a request and response interceptor per #601 with promises', function(done) {
    var startTime = 0;
    var elapsed = 0;

    var interceptor = {
      requestInterceptor: {
        apply: function (requestObj) {
          startTime = new Date().getTime();
          return requestObj;
        }
      },
      responseInterceptor: {
        apply: function (responseObj) {
          elapsed = new Date().getTime() - startTime;
          return responseObj;
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000/v2/petstore.json',
      usePromise: true,
      requestInterceptor: interceptor.requestInterceptor,
      responseInterceptor: interceptor.responseInterceptor
    }).then(function(client) {
      client.pet.getPetById({petId: 1}).then(function (pet){
        expect(pet.obj).toBeAn('object');
        expect(elapsed).toBeGreaterThan(0);
        done();
      });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('passes headers to the request interceptor', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            operationId: 'addFoo',
            tags: [
              'nada'
            ],
            parameters: [
              {
                in: 'header',
                name: 'username',
                type: 'string'
              }
            ],
            responses: {
              '200': {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    var interceptor = {
      requestInterceptor: {
        apply: function (requestObj) {
          /**
           * Verify the payload.  You have the following available in `requestObj`:
           *
           * request.Obj.headers          <= map of headers to be sent, includes Content-Type, Accept headers
           * requestObj.body              <= the content to send, undefined of none
           * requestObj.method            <= the HTTP operation to execute
           * requestObj.url               <= the fully resolved URL, including query params, to send
           * requestObj.on.response       <= success function to execute
           * requestObj.on.error          <= error function to execute on failure
           *
           * NOTE! It is not recommended to override the on.response / on.error functions as it may
           * interrupt downstream processing in the client.  Use the responseInterceptor pattern instead
           *
           **/

          // ensure the headers are present
          expect(requestObj.headers.username).toBe('bob');

          // rewrite this request to something that'll work locally
          requestObj.method = 'GET';
          requestObj.url = 'http://localhost:8000/v2/api/pet/1';
          return requestObj;
        }
      }
    };

    new SwaggerClient({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      spec: spec,
      usePromise: true,
      requestInterceptor: interceptor.requestInterceptor
    }).then(function(client) {
      client.nada.addFoo({username: 'bob'}).then(function (){
        done();
      });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('uses a custom http client implementation', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            operationId: 'addFoo',
            tags: [
              'nada'
            ],
            parameters: [
              {
                in: 'header',
                name: 'username',
                type: 'string'
              }
            ],
            responses: {
              '200': {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    var myHttpClient = {
      execute: function(requestObj) {
        /**
         * Do your magic here.  When done, you should call the responseObj callback if successful
         * For this mock client, just make it act async
         */

        setTimeout(function() {
          requestObj.on.response({
            obj: {
              // payload
              content: 'it works!'
            },
            status: 200,
            statusText: 'it works!'
          });
          // and if something goes wrong call requestObj.on.error and pass the payload
        }, 1000);
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true,
      client: myHttpClient
    }).then(function(client) {
      client.nada.addFoo({username: 'bob'}).then(function (data){
        expect(data.obj).toBeAn('object');
        expect(data.status).toBe(200);
        done();
      });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('tests issue 743', function(done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            tags: ['hi'],
            operationId: 'there',
            parameters: [
              {
                in: 'query',
                name: 'values',
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['a', 'b']
                }
              }
            ],
            responses: {
              '200': {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var allowable = client
        .apis.hi
        .operations.there
        .parameters[0].allowableValues;
       expect(allowable.values).toBeAn('object');
       expect(allowable.values).toEqual(['a', 'b']);
       done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('verifies the order of tags', function(done) {
    var spec = {
      swagger: '2.0',
      info: {
        title: 'Swagger tags order',
        'description' : 'Show tags order is alphabetical, not explicit \'tags\' order',
        version: '1'
      },
      tags : [
        { name : 'Most important resources',
          description : 'I want these listed first'
        },
        { name : 'Not important resources',
          description : 'I want these listed after most'
        },
        { name : 'Least important resources',
          description : 'I want these listed last'
        }
      ],
      schemes: [
        'http'
      ],
      paths: {
        '/not/important/resource': {
          get: {
            tags : [ 'Not important resources' ],
            summary : 'Get API resouce links',
            produces: [ 'application/json' ],
            responses: {
              200: {
                description: 'something less important'
              }
            }
          }
        },
        '/less/important/resource': {
          get: {
            tags : [ 'Least important resources' ],
            summary : 'Get API resouce links',
            produces: [ 'application/json' ],
            responses: {
              200: {
                description: 'something less important'
              }
            }
          }
        },
        '/important/resources': {
          get: {
            tags : [ 'Most important resources' ],
            summary : 'Get API resouce links',
            produces: [ 'application/json' ],
            responses: {
              200: {
                description: 'something more important'
              }
            }
          }
        },
        '/more/important/resources': {
          get: {
            tags : [ 'Most important resources' ],
            summary : 'Get API resouce links',
            produces: [ 'application/json' ],
            responses: {
              200: {
                description: 'something more important'
              }
            }
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      expect(client.apisArray[0].name).toEqual('Most important resources');
      expect(client.apisArray[1].name).toEqual('Not important resources');
      expect(client.apisArray[2].name).toEqual('Least important resources');
      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('applies auth on a per-request basis', function(done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            tags: ['hi'],
            operationId: 'there',
            security: {
              authMe: []
            },
            parameters: [
              {
                in: 'query',
                name: 'name',
                type: 'string'
              }
            ],
            responses: {
              '200': {
                description: 'ok'
              }
            }
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.hi.there(
          {
            name: 'bob'
          },
          {
            clientAuthorizations: {
              authMe: new auth.PasswordAuthorization('foo', 'bar')
            },
            mock: true
          });
      expect(mock.headers.Authorization).toEqual('Basic Zm9vOmJhcg==');
      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('passes the correct content-type', function(done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [
                'test'
            ],
            operationId: 'formData',
            consumes: ['multipart/form-data'],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'string',
                required: false
              }
            ]
          }
        },
        '/bar': {
          post: {
            tags: [
              'test'
            ],
            operationId: 'encoded',
            consumes: ['application/x-www-form-urlencoded'],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'string',
                required: false
              }
            ]
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.formData({
        name: 'bob'
      }, {
        mock: true
      });
      expect(mock.headers).toBeAn('object');
      expect(mock.headers['Content-Type']).toBe('multipart/form-data');

      mock = client.test.encoded({
        name: 'bob'
      }, {
        mock: true
      });
      expect(mock.headers).toBeAn('object');
      expect(mock.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('passes formData in an array with csv', function(done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [
              'test'
            ],
            operationId: 'encodedArray',
            consumes: ['application/www-form-urlencoded'],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'array',
                items: {
                  type: 'string'
                },
                collectionFormat: 'csv',
                required: false
              }
            ]
          }
        }
      },
      '/bar': {
        post: {
          tags: [
            'test'
          ],
          operationId: 'formDataArray',
          consumes: ['multipart/form-data'],
          parameters: [
            {
              in: 'formData',
              name: 'name',
              type: 'array',
              items: {
                type: 'string'
              },
              collectionFormat: 'csv',
              required: false
            }
          ]
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.encodedArray({
        name: ['bob', 'fred']
      }, {
        mock: true
      });
      expect(mock.body).toBe('name=bob,fred');
      expect(mock.headers).toBeAn('object');
      expect(mock.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('passes formData in an array with multi', function(done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [
              'test'
            ],
            operationId: 'encodedArray',
            consumes: ['application/www-form-urlencoded'],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'array',
                items: {
                  type: 'string'
                },
                collectionFormat: 'brackets',
                required: false
              }
            ]
          }
        }
      },
      '/bar': {
        post: {
          tags: [
            'test'
          ],
          operationId: 'formDataArray',
          consumes: ['multipart/form-data'],
          parameters: [
            {
              in: 'formData',
              name: 'name[]',
              type: 'array',
              items: {
                type: 'string'
              },
              collectionFormat: 'csv',
              required: false
            }
          ]
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.encodedArray({
        'name': ['bob', 'fred']
      }, {
        mock: true
      });
      expect(mock.body).toBe('name[]=bob&name[]=fred');
      expect(mock.headers).toBeAn('object');
      expect(mock.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('doesnt add double slashes with incorrect basePath', function(done) {
    var spec = {
      basePath: '/double/',
      paths: {
        '/foo': {
          get: {
            tags: [
              'test'
            ],
            operationId: 'slash',
            parameters: [],
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.slash({}, {mock: true});
      expect(mock.url).toBe('http://localhost:8000/double/foo');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('doesnt escape query keys for #787', function(done) {
    var spec = {
      basePath: '/double/',
      paths: {
        '/foo': {
          get: {
            tags: [
              'test'
            ],
            operationId: 'slash',
            parameters: [
              {
                in: 'query',
                name: '$offset',
                type: 'integer',
                format: 'int32'
              },
              {
                in: 'query',
                name: 'names[]',
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            ]
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.slash({'$offset': 10, 'names[]': ['fred', 'bob']}, {mock: true});
      expect(mock.url).toBe('http://localhost:8000/double/foo?$offset=10&names[]=fred%2Cbob');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should post a single multipart data', function(done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            operationId: 'mypost',
            consumes: ['multipart/form-data'],
            tags: [ 'test' ],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'string'
              }
            ]
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://example.com/petstore.yaml',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      client.test.mypost({name: 'tony'})
        .then(function () {
          done('it failed');
        })
        .catch(function () {
          done();
        });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should post a multipart array', function(done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            operationId: 'mypost',
            consumes: ['multipart/form-data'],
            tags: [ 'test' ],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            ]
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      client.test.mypost({name: ['tony', 'tam']})
          .then(function () {
            done('it failed');
          })
          .catch(function () {
            done();
          });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should resolve a model per issue 716', function(done) {
    new SwaggerClient({
      url: 'http://localhost:8000/v2/issue-716.yaml',
      usePromise: true
    }).then(function(client) {
      var models = client.models;
      console.log(models.SuperErrorModel.createJSONSample());
      console.log(models.SuperErrorModel.getMockSignature());
      console.log(models.SuperErrorModel.getSampleValue());

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });
});
