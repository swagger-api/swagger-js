/* global describe, it */

'use strict';

var _ = require('lodash-compat');
var expect = require('expect');
var petstoreRaw = require('./spec/v2/petstore.json');
var SwaggerClient = require('..');
var auth = require('../lib/auth');
var fs = require('fs');
var md5 = require('md5-file');

/* jshint ignore:start */
var mock = require('./mock');
var instance;
var testBlobMD5;
/* jshint ignore:end */

describe('SwaggerClient', function () {
  /* jshint ignore:start */
  before(function (done) {
    testBlobMD5 = md5.sync('test/spec/v2/blob/image.png');
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
      client = new SwaggerClient({
        spec: petstoreRaw,
        usePromise: true
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

  it('should accept a timeout', function(done) {
    var timeoutValue = 1000;
    var client = new SwaggerClient({
      spec: petstoreRaw,
      timeout: timeoutValue,
      success: function () {
        expect(client.timeout).toBe(timeoutValue);
        expect(client.fetchSpecTimeout).toBe(timeoutValue);
        done();
      }
    });
  });

  it('should accept a timeout for fetching a spec', function(done) {
    var timeoutValue = 1000;
    var client = new SwaggerClient({
      spec: petstoreRaw,
      fetchSpecTimeout: timeoutValue,
      success: function () {
        expect(client.timeout).toBe(null);
        expect(client.fetchSpecTimeout).toBe(timeoutValue);
        done();
      }
    });
  });

  it('should prefer fetchSpecTimeout over timeout when both are specified', function(done) {
    var timeoutValue = 1000;
    var fetchSpecTimeoutValue = 2000;
    var client = new SwaggerClient({
      spec: petstoreRaw,
      timeout: timeoutValue,
      fetchSpecTimeout: fetchSpecTimeoutValue,
      success: function () {
        expect(client.timeout).toBe(timeoutValue);
        expect(client.fetchSpecTimeout).toBe(fetchSpecTimeoutValue);
        done();
      }
    });
  });

  it('should use a timeout when fetching a spec', function (done) {
    new SwaggerClient({
      url: 'http://localhost:8000/v2/petstore.json',
      fetchSpecTimeout: 1,
      success: function () {
        expect().toExist('Fetch spec timeout was not applied');
        done();
      },
      failure: function (message) {
        expect(message).toBe('Request timed out after 1ms');
        done();
      }
    });
  });

  it('should use a timeout when making an operation request', function (done) {
    var timeout = 1;
    new SwaggerClient({
      url: 'http://localhost:8000/v2/petstore.json',
      usePromise: true,
      timeout: timeout,
      // pass null to avoid false failures when fetching spec
      fetchSpecTimeout: null
    }).then(function (client) {
      client.pet.getPetById({petId: 1})
        .then(function () {
          expect().toExist('Operation request timeout was not applied');
        }).catch(function (err) {
          expect(err.errObj.message).toBe('timeout of 1ms exceeded', 'Operation request timeout was not applied');
          done();
        });
    }).catch(done);
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
      expect(client.default['test_0']).toBeAn('function');
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
                name: 'Accept-Language',
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
          expect(requestObj.headers['Accept-Language']).toBe('fr');

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
      client.nada.addFoo({'accept-LANGUAGE': 'fr'}).then(function (){
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

  it('should post a multipart array with csv format', function(done) {
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
                collectionFormat: 'csv',
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
      var curl = client.test.mypost.asCurl({name: ['tony', 'tam']});
      expect(curl).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' -F name=tony,tam  \'http://localhost:8080/foo\'');
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should post a multipart array with multi format', function(done) {
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
                collectionFormat: 'multi',
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
      var curl = client.test.mypost.asCurl({name: ['tony', 'tam']});
      expect(curl).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' -F name=tony -F name=tam  \'http://localhost:8080/foo\'');
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should resolve a model per issue 716', function(done) {
    new SwaggerClient({
      url: 'http://localhost:8000/v2/issue-716.yaml',
      usePromise: true
    }).then(function() {
      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should catch an error', function(done) {
    new SwaggerClient({
      url: 'http://localhost:8000/v2/issue-716.yaml',
      usePromise: true
    }).then(function(client) {
      client.Data.getPets()
        .then(function(data) {
          done('shoulda failed');
        })
        .catch(function(err) {
          done();
        })
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should read a blob', function(done) {
    var spec = {
      paths: {
        '/v2/blob/image.png': {
          get: {
            operationId: 'getBlob',
            produces: ['image/png'],
            tags: [ 'test' ],
            parameters: [],
            responses: {
              default: {
                description: 'ok',
                schema: {
                  type: 'string',
                  format: 'byte'
                }
              }
            }
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      client.test.getBlob({})
        .then(function (response) {
          var filename = './file.tmp';
          fs.writeFile(filename, response.data, function(err) {
            if(err) {
              return done('it failed');
            }
            var hash = md5.sync(filename);
            expect(hash).toBe(testBlobMD5);
            fs.unlinkSync(filename);
            done();
          });
        })
        .catch(function () {
          done('it failed');
        });
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('should keep password format', function(done) {
    var spec = {
      schemes: ['https'],
      paths: {
        '/v2/nada': {
          get: {
            operationId: 'getNothing',
            tags: [ 'test' ],
            parameters: [{
              in: 'query',
              name: 'password',
              type: 'string',
              format: 'password',
              required: true
            }],
            responses: {
              default: {
                description: 'ok'
              }
            }
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      expect(client.apis.test.operations.getNothing.parameters[0].format).toBe('password');
      expect(client.apis.test.operations.getNothing.asCurl({password: 'hidden!'})).toBe('curl -X GET --header \'Accept: application/json\' \'https://localhost:8000/v2/nada?password=******\'');
      done();
    });
  });

  it('should honor schemes', function(done) {
    var spec = {
      schemes: ['https'],
      paths: {
        '/v2/nada': {
          get: {
            operationId: 'getNothing',
            tags: [ 'test' ],
            parameters: [],
            responses: {
              default: {
                description: 'ok'
              }
            }
          }
        }
      }
    };

    new SwaggerClient({
      url: 'http://localhost:8000',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.getNothing({},{mock: true});
      expect(mock.url).toEqual('https://localhost:8000/v2/nada');
      done();
    });
  });

  it('should read vendor extensions', function(done) {
    new SwaggerClient({
      url: 'http://localhost:8000/v2/extensions.yaml',
      usePromise: true
    }).then(function(client) {
      var swagger = client.swaggerObject;
      // swagger objects
      expect(swagger['x-root-extension']).toEqual('root');
      expect(swagger.info.contact['x-contact-extension']).toEqual('contact');
      expect(swagger.info.license['x-license-extension']).toEqual('license');
      expect(swagger.securityDefinitions.myKey['x-auth-extension']).toEqual('auth');
      expect(swagger.securityDefinitions.myOAuth.scopes['x-scopes-extension']).toEqual('scopes');
      expect(swagger.tags[0]['x-tags-extension']).toEqual('tags');
      expect(swagger.paths['x-paths-extension']).toEqual('paths');
      expect(swagger.paths['/device'].get['x-operation-extension']).toEqual('operation');
      expect(swagger.paths['/device'].get.externalDocs['x-external-docs-extension']).toEqual('docs');
      expect(swagger.paths['/device'].get.parameters[0]['x-parameter-extension']).toEqual('parameter');
      expect(swagger.paths['/device'].get.responses['x-responses-extension']).toEqual('responses');

      // until we expose all responses, these assertion must be disabled.
      // expect(swagger.paths['/device'].get.responses['200']['x-response-extension']).toEqual('response');
      // expect(swagger.paths['/device'].get.responses['200'].headers['my-header']['x-header-extension']).toEqual('header');

      // client object
      expect(client.securityDefinitions.myKey.vendorExtensions['x-auth-extension']).toBe('auth');
      expect(client.securityDefinitions.myOAuth.scopes.vendorExtensions['x-scopes-extension']).toBe('scopes');

      expect(client.myTag.vendorExtensions['x-tags-extension']).toEqual('tags');
      expect(client.myTag.externalDocs.vendorExtensions['x-external-docs-in-tag']).toEqual('docs-in-tag');

      expect(client.myTag.apis.deviceSummary.vendorExtensions['x-operation-extension']).toEqual('operation');

      expect(client.myTag.apis.deviceSummary.externalDocs.vendorExtensions['x-external-docs-extension']).toEqual('docs');
      expect(client.myTag.apis.deviceSummary.vendorExtensions['x-operation-extension']).toEqual('operation');
      expect(client.myTag.apis.deviceSummary.parameters[0].vendorExtensions['x-parameter-extension']).toEqual('parameter');

      expect(client.myTag.apis.deviceSummary.responses.vendorExtensions['x-responses-extension']).toEqual('responses');
      expect(client.myTag.apis.deviceSummary.successResponse['200'].vendorExtensions['x-response-extension']).toEqual('response');

      expect(client.myTag.apis.deviceSummary.successResponse['200'].headers['my-header'].vendorExtensions['x-header-extension']).toEqual('header');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('honors allowEmptyValue #825', function(done) {
    var spec = {
      basePath: '/double/',
      paths: {
        '/foo': {
          get: {
            tags: [
              'test'
            ],
            operationId: 'slash',
            parameters: [{
              in: 'query',
              allowEmptyValue: true,
              name: 'happy',
              type: 'string',
              required: false
            }],
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
      expect(mock.url).toBe('http://localhost:8000/double/foo?happy=');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });


  it('doesnt remove 0 from query params', function(done) {
    var spec = {
      basePath: '/double/',
      paths: {
        '/foo': {
          get: {
            tags: [
              'test'
            ],
            operationId: 'slash',
            parameters: [{
              in: 'query',
              name: 'bar',
              type: 'integer',
              required: false
            }],
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.slash({bar: 0}, {mock: true});
      expect(mock.url).toBe('http://localhost:8000/double/foo?bar=0');

      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('honors allowEmptyValue #825 in arrays', function(done) {
    var spec = {
      basePath: '/double/',
      paths: {
        '/foo': {
          get: {
            tags: [
              'test'
            ],
            operationId: 'slash',
            parameters: [{
              in: 'query',
              allowEmptyValue: true,
              name: 'happy',
              type: 'array',
              items: {
                type: 'string'
              },
              required: false
            }],
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
      expect(mock.url).toBe('http://localhost:8000/double/foo?happy=');
      done();
    }).catch(function(exception) {
      done(exception);
    });
  });

  it('passes data in a delete with formData', function(done) {

    var spec = {
      paths: {
        '/foo': {
          delete: {
            tags: [
              'test'
            ],
            operationId: 'removeMe',
            consumes: [
                'x-www-form-urlencoded'
            ],
            parameters: [{
              in: 'formData',
              name: 'username',
              type: 'string',
              required: false
            }],
          }
        }
      }
    };
    new SwaggerClient({
      url: 'http://localhost:8000/v2/swagger.json',
      spec: spec,
      usePromise: true
    }).then(function(client) {
      var mock = client.test.removeMe({username: 'Tony'}, {mock: true});
      expect(mock.body).toBe('username=Tony');
      expect(mock.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      done();
    }).catch(function(exception) {
      done(exception);
    });
  })

  it('verifies a 201 response #820', function(done) {
    new SwaggerClient({
      spec: petstoreRaw,
      usePromise: true
    }).then(function (client) {
      return client.pet.getPetById({petId: 777})
    }).then(function (data) {
      expect(data.status).toBe(201);
      done();
    }).catch(function(err) {
      done('oops');
    })
  });

  it('verifies a 400 response #820', function(done) {
    new SwaggerClient({
      spec: petstoreRaw,
      usePromise: true
    }).then(function (client) {
      return client.pet.getPetById({petId: 666})
    }).then(function (data) {
      done('expected an error');
    }).catch(function(err) {
      expect(err.status).toBe(400);
      expect(err.obj).toEqual({code: 400, message: 'sorry!', type: 'bad input'});
      done();
    })
  });
});
