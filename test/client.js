/* global describe, it */

'use strict';

var _ = require('lodash-compat');
var expect = require('expect');
var petstoreRaw = require('./spec/v2/petstore.json');
var SwaggerClient = require('..');

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

  it('should should use a responseInterceptor', function(done) {
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
});
