/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./mock');
var SwaggerSpecConverter = require('../../lib/spec-converter');
var SwaggerHttp = require('../../lib/http');
var SwaggerClient = require('../..');

var sample, instance;

describe('converts specs', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  it('ignores an empty spec', function(done) {
      var converter = new SwaggerSpecConverter();
      converter.convert({}, {}, {}, function(result) {
        expect(result).toBe(null);
        done();
      });
  });

  it('converts the petstore 1.2 spec', function (done) {
    var obj = {
      url: 'http://localhost:8001/v1/api-docs.json',
      method: 'get',
      headers: {accept: 'application/json'},
      on: {}
    };
    obj.on.response = function(data) {
      var converter = new SwaggerSpecConverter();
      converter.setDocumentationLocation('http://localhost:8001/v1/api-docs');
      converter.convert(data.obj, {}, {}, function(swagger) {
        test.array(swagger.tags);
        var petTag = swagger.tags[0];
        var userTag = swagger.tags[1];
        var storeTag = swagger.tags[2];

        expect(petTag.name).toBe('pet');
        expect(userTag.name).toBe('user');
        expect(storeTag.name).toBe('store');

        // metadata tests
        expect(swagger.swagger).toBe('2.0');

        var info = swagger.info;
        test.object(info);
        test.object(info.contact);
        test.string(info.description);
        test.string(info.title);
        test.string(info.termsOfService);
        test.object(swagger.license);
        expect(swagger.license.name).toBe('Apache 2.0');
        expect(swagger.license.url).toBe('http://www.apache.org/licenses/LICENSE-2.0.html');

        // paths
        expect(Object.keys(swagger.paths).length).toBe(16);

        // getPet
        var getPet = swagger.paths['/pet/{petId}'].get;
        expect(getPet.parameters.length).toBe(1);

        var param = getPet.parameters[0];
        expect(param.name).toBe('petId');
        expect(param.description).toBe('ID of pet that needs to be fetched');
        expect(param.in).toBe('path');
        expect(param.minimum).toBe('1.0');
        expect(param.maximum).toBe('100000.0');
        expect(param.type).toBe('integer');
        expect(param.format).toBe('int64');

        // enums
        var getPetsByStatus = swagger.paths['/pet/findByStatus'].get;
        expect(getPetsByStatus.parameters[0].enum).toEqual([ 'available', 'pending', 'sold' ]);

        // type = void, '', or undefined
        // If no type, should have no schema
        var postPet = swagger.paths['/pet'].post;
        expect(postPet.responses['200']).toEqual({});

        // responses
        var responses = getPet.responses;
        expect(Object.keys(responses).length).toBe(3);

        expect(responses['200'].schema.$ref).toBe('#/definitions/Pet');
        expect(responses['400'].description).toBe('Invalid ID supplied');
        expect(responses['404'].description).toBe('Pet not found');

        // models
        var definitions = swagger.definitions;
        expect(Object.keys(definitions).length).toBe(9);
        var pet = definitions.Pet;
        expect(Object.keys(pet.properties).length).toBe(8);
        var photos = pet.properties.photoUrls;
        expect(photos.type).toBe('array');
        test.object(photos.items);
        expect(photos.items.type).toBe('string');
        done();
      });
    };

    new SwaggerHttp().execute(obj);
  });

  it('converts a single file 1.2 spec', function (done) {
    var obj = {
      url: 'http://localhost:8001/v1/single.json',
      method: 'get',
      headers: {accept: 'application/json'},
      on: {}
    };
    obj.on.response = function(data) {
      var converter = new SwaggerSpecConverter();
      converter.setDocumentationLocation('http://localhost:8001/v1/api-docs');
      converter.convert(data.obj, {}, {}, function(swagger) {

        // metadata tests
        expect(swagger.swagger).toBe('2.0');
        test.object(swagger.info);
        var info = swagger.info;
        test.string(info.description);
        test.string(info.title);
        test.string(info.termsOfService);
        test.object(swagger.license);
        expect(swagger.license.name).toBe('Apache 2.0');
        expect(swagger.license.url).toBe('http://www.apache.org/licenses/LICENSE-2.0.html');

        // paths
        expect(Object.keys(swagger.paths).length).toBe(5);

        // getPet
        var getPet = swagger.paths['/pet/{petId}'].get;

        expect(getPet.description).toBe('Returns a pet based on ID');
        expect(getPet.parameters.length).toBe(1);

        var param = getPet.parameters[0];
        expect(param.name).toBe('petId');
        expect(param.description).toBe('ID of pet that needs to be fetched');
        expect(param.in).toBe('path');
        expect(param.minimum).toBe('1.0');
        expect(param.maximum).toBe('100000.0');
        expect(param.type).toBe('integer');
        expect(param.format).toBe('int64');

        // addPet
        var addPet = swagger.paths['/pet/{petId}'].post;
        var security = addPet.security;
        test.array(security);
        expect(security.length).toBe(1);
        var scopes = security[0].oauth2;
        test.array(scopes);
        expect(scopes.length).toBe(1);
        expect(scopes[0]).toBe('test:anything');

        // responses
        var responses = getPet.responses;
        expect(Object.keys(responses).length).toBe(3);

        expect(responses['200'].schema.$ref).toBe('#/definitions/Pet');
        expect(responses['400'].description).toBe('Invalid ID supplied');
        expect(responses['404'].description).toBe('Pet not found');

        // models
        var definitions = swagger.definitions;
        expect(Object.keys(definitions).length).toBe(3);
        var pet = definitions.Pet;
        expect(Object.keys(pet.properties).length).toBe(6);
        var photos = pet.properties.photoUrls;
        expect(photos.type).toBe('array');
        test.object(photos.items);
        expect(photos.items.type).toBe('string');

        var category = definitions.Category;
        expect(Object.keys(category.properties).length).toBe(3);
        var metadata = category.properties.metadata;
        expect(metadata.type).toBe('object');

        done();
      });
    };

    new SwaggerHttp().execute(obj);
  });


  it('converts a single file 1.0 spec', function (done) {
    var obj = {
      url: 'http://localhost:8001/v1/word.json',
      method: 'get',
      headers: {accept: 'application/json'},
      on: {}
    };
    obj.on.response = function(data) {
      var converter = new SwaggerSpecConverter();
      converter.setDocumentationLocation('http://localhost:8001/v1/word.json');
      converter.convert(data.obj, {}, {}, function(swagger) {
        expect(Object.keys(swagger.paths).length).toBe(12);

        var getDefinitions = swagger.paths['/word.{format}/{word}/definitions'].get;

        expect(getDefinitions.summary).toBe('Return definitions for a word');
        expect(getDefinitions.parameters.length).toBe(7);
        var sourceDictionaries = getDefinitions.parameters[4];
        expect(sourceDictionaries.in).toBe('query');
        expect(sourceDictionaries.type).toBe('array');
        test.object(sourceDictionaries.items);
        expect(sourceDictionaries.items.type).toBe('string');
        test.array(sourceDictionaries['enum']);

        var response200 = getDefinitions.responses['200'];
        expect(response200.schema.type).toBe('array');
        expect(response200.schema.items.$ref).toBe('#/definitions/Definition');

        var getAudio = swagger.paths['/word.{format}/{word}/audio'].get;
        expect(getAudio.summary).toBe('Fetches audio metadata for a word.');
        expect(getAudio.description).toBe('The metadata includes a time-expiring fileUrl which allows reading the audio file directly from the API.  Currently only audio pronunciations from the American Heritage Dictionary in mp3 format are supported.');

        done();
      });
    };

    new SwaggerHttp().execute(obj);
  });

  it('creates a request for 1.0 resource', function(done) {
    var client = new SwaggerClient();
    client.initialize('http://localhost:8001/v1/word.json', {success: function () {
      var args = { word: 'cat' };
      var opts = { mock: true };

      var obj = client.word.getRelatedWords(args, opts);
      expect(obj.url).toBe('http://api.wordnik.com/v4/word.json/cat/relatedWords');
      done();
    }});
  });

  var issuesSpec;
  describe('edge cases for v1.2', function() {

    before(function(done){
      var obj = {
        url: 'http://localhost:8001/v1/issues.json',
        method: 'get',
        headers: {accept: 'application/json'},
        on: {}
      };
      obj.on.response = function(data) {
        var converter = new SwaggerSpecConverter();
        converter.setDocumentationLocation('http://localhost:8001/v1/api-docs');
        converter.convert(data.obj, {}, {}, function(swagger) {
          issuesSpec = swagger;
          done();
        });
      };

      obj.on.error = function(err){
        console.log('err', err);
      };

      // Get/convert our spec
      new SwaggerHttp().execute(obj);
    });

    it('handles operation.responseModel', function () {
      var spec = issuesSpec;

      var operation = spec.paths['/responseModels'].get;
      expect(Object.keys(operation.responses).length).toBe(3); // 200 + 400 + default

      expect(operation.responses['200'].schema).toEqual({'$ref': '#/definitions/Test'});
      expect(operation.responses['404']).toEqual({description: 'You got no Test'});

    });

    it('carries over schema.required array', function () {
      // sanity test
      var spec = issuesSpec;
      expect(spec.swagger).toBe('2.0');


      var model = spec.definitions.TestRequired;
      expect(model.required).toBeA(Array);
      expect(model.required).toInclude('one');

    });

    it('makes the expected requests', function(done) {
      var callCount = 0;

      var interceptor = {
        requestInterceptor: {
          apply: function (requestObj) {
            // rewrites an invalid pet id (-100) to be valid (1)
            // you can do what you want here, like inject headers, etc.
            callCount += 1;
            return requestObj;
          }
        }
      };

      new SwaggerClient({
        url: 'http://localhost:8001/v1/api-docs.json',
        usePromise: true,
        requestInterceptor: interceptor.requestInterceptor
      }).then(function(client) {
        var operation = client.apis.pet.operations.getPetById;
        expect(operation.successResponse[200].definition).toBeAn('object');
        expect(operation.responses[400].schema).toBeAn('object');
        expect(operation.responses[400].schema.$ref).toBe('#/definitions/VeryBad');
        expect(callCount).toEqual(4);
        done();
      }).catch(function(e) {
        console.log(e);
        done(e);
      });
    });
  });
});
