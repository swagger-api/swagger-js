/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./mock');
var sample, instance;

describe('swagger request functions', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();

    sample.clientAuthorizations.authz = {};
    done();
  });

  it('posts an object', function (done) {
    var petApi = sample.pet;

    petApi.createPet({body: {id: 100, name: 'gorilla'}}, function (resp) {
      expect(resp.obj.id).toBe(100);
      expect(resp.obj.name).toBe('gorilla');

      done();
    });
  });

  it('posts an empty object', function (done) {
    var petApi = sample.pet;

    var obj = petApi.createPet({}, {mock: true});
    expect(obj.body).toBe('{}');
    done();
  });

  it('posts a string value', function (done) {
    var petApi = sample.pet;

    petApi.createPet({body: '{"id": 100, "name": "gorilla"}'}, function (resp) {
      expect(resp.obj.id).toBe(100);
      expect(resp.obj.name).toBe('gorilla');

      done();
    });
  });

  it('gets the resource description', function () {
    var userApi = sample.user;

    expect(userApi.description).toEqual('All about the Users');
  });

  it('gets the resource external docs', function () {
    var petApi = sample.pet;

    expect(petApi.description).toEqual('Pet Operations');
    expect(petApi.externalDocs).toEqual('http://swagger.io');
  });

  it('generate a get request', function () {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1');
  });

  it('generate a get request with query params', function () {
    var petApi = sample.pet;
    var req = petApi.findPetsByTags({tags: ['tag 1', 'tag 2']}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/findByTags?tags=tag%201&tags=tag%202');
  });

  it('generate a get request with email query param array', function () {
    var petApi = sample.pet;
    var req = petApi.findPetsByStatus({status: ['fehguy@gmail.com', 'nada']}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/findByStatus?status=fehguy%40gmail.com|nada');
  });

  it('generate a POST request with body', function () {
    var petApi = sample.pet;
    var req = petApi.addPet({body: {id: 100, name: 'gorilla'}}, {mock: true});

    test.object(req);

    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet');
    expect(req.body).toEqual({ id: 100, name: 'gorilla' });
  });

  it('generate a POST request with no body', function () {
    var petApi = sample.pet;
    var req = petApi.addPet({}, {mock: true});

    test.object(req);

    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet');
    expect(req.body).toBe('{}');
  });

  it('generate a POST request with an empty body', function () {
    var petApi = sample.pet;
    var req = petApi.addPet({body:{}}, {mock: true});

    test.object(req);

    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet');
    expect(req.body).toEqual({});
  });

  it('generate a POST request for application/x-www-form-urlencoded', function () {
    var petApi = sample.pet;
    var req = petApi.updatePetWithForm({petId:100, name: 'monster', status: 'miserable dog'}, {mock: true});

    test.object(req);

    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/100');
    expect(req.body).toEqual('name=monster&status=miserable%20dog');
  });

  it('generate a DELETE request with no body', function () {
    var petApi = sample.pet;
    var req = petApi.deletePet({petId: 100}, {mock: true});

    test.object(req);

    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe(undefined);
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/100');
    expect(req.body).toBe(undefined);
  });

  it('generate a DELETE request with body', function () {
    var petApi = sample.pet;
    var req = petApi.deletePet({petId: 100, body: {id: 100, name: 'gorilla'}}, {mock: true});

    test.object(req);

    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/100');
    expect(req.body).toEqual({ id: 100, name: 'gorilla' });
  });

  it('generate a DELETE request with formData', function () {
    var petApi = sample.pet;

    // Monkey-patch delete operation to use form params
    var deleteParams = petApi.operations.deletePet.parameters;
    var petIdParam = deleteParams.find(function(p) { return p.name === 'petId'; });
    var opBackup = {in: petIdParam.in, paramType: petIdParam.paramType};
    petIdParam.in = petIdParam.paramType = 'formData';

    var req = petApi.deletePet({petId: 100}, {mock: true});

    test.object(req);

    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/{petId}');
    expect(req.body).toEqual('petId=100');

    // Restore op
    petIdParam.in = opBackup.in;
    petIdParam.paramType = opBackup.paramType;
  });

  it('escape an operation id', function () {
    var storeApi = sample.store.get_inventory_1; // jshint ignore:line

    expect(typeof storeApi).toEqual('function');
  });

  it('return a json sample in array', function () {
    var successResponse = sample.pet.operations.findPetsByTags.successResponse;

    expect(typeof successResponse['200']).toBe('object');
    expect(successResponse['200'].createJSONSample()).toEqual([
      {
        id: 0,
        category: {
          id: 0,
          name: 'string'
        },
        name: 'doggie',
        photoUrls: [
          'string'
        ],
        tags: [
          {
            id: 0,
            name: 'string'
          }
        ],
        status: 'string'
      }
    ]);
  });

  it('return a json sample from an array model', function () {
    var successResponse = sample.pet.operations.findPetsByStatus.successResponse;

    expect(typeof successResponse['200']).toBe('object');
    expect(successResponse['200'].createJSONSample()).toEqual([
      {
        id: 0,
        category: {
          id: 0,
          name: 'string'
        },
        name: 'doggie',
        photoUrls: [
          'string'
        ],
        tags: [
          {
            id: 0,
            name: 'string'
          }
        ],
        status: 'string'
      }
    ]);
  });

  it('verifies useJQuery is set', function () {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {useJQuery: true, mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1');
    expect(req.useJQuery).toBe(true);
  });

  it('verifies jqueryAjaxCache is set', function () {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {useJQuery: true, jqueryAjaxCache: true, mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1');
    expect(req.jqueryAjaxCache).toBe(true);
  });

  it('does not add a query param if not set', function () {
    var petApi = sample.pet;
    var req = petApi.findPetsByStatus({}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/findByStatus');
  });

  it('does not add a query param if undefined', function () {
    var petApi = sample.pet;
    var req = petApi.findPetsByStatus({status: undefined}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/findByStatus');
  });

  it('should set the correct accept type', function () {
    var petApi = sample.pet;
    var req = petApi.findPetsByStatus({status: undefined}, {mock: true, responseContentType: 'application/xml'});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/xml');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/findByStatus');
  });

  it('should set the correct scheme', function () {
    var userApi = sample.user;
    var req = userApi.loginUser({username: 'fred', password: 'meyer'}, {mock: true});

    test.object(req);

    expect(req.url).toBe('https://localhost:8000/v2/api/user/login?username=fred&password=meyer');
  });

  it('should process a delete request with headers', function () {
    var petApi = sample.pet;
    var req = petApi.deletePet({petId: 1, api_key: 'abc123'}, {mock: true}); // jshint ignore:line

    test.object(req);

    expect(req.method).toEqual('DELETE');
    expect(req.url).toEqual('http://localhost:8000/v2/api/pet/1');
    expect(req.headers.api_key).toEqual('abc123'); // jshint ignore:line
  });

  it('prints a curl post statement from an object', function () {
    var petApi = sample.pet;
    var curl = petApi.addPet.asCurl({body: {id:10101}});

    expect(curl).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' --data-raw \'{"id":10101}\' \'http://localhost:8000/v2/api/pet\'');
  });

  it('prints a curl post statement from a string', function () {
    var petApi = sample.pet;
    var curl = petApi.addPet.asCurl({body: '{"id":10101}'});

    expect(curl).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' --data-raw \'{"id":10101}\' \'http://localhost:8000/v2/api/pet\'');
  });

  it('prints a curl post statement from a string containing a single quote', function () {
    var petApi = sample.pet;
    var curl = petApi.addPet.asCurl({body: '{"id":"foo\'bar"}'});

    expect(curl).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' --data-raw \'{"id":"foo\\u0027bar"}\' \'http://localhost:8000/v2/api/pet\'');
  });

  it('prints a curl post statement from an object containing a file', function () {
    var petApi = sample.pet;
    var curl = petApi.uploadFile.asCurl({petId: 1234, file: {name: 'testfile', type: 'file'}});

    expect(curl).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' -F file=@\"testfile"  \'http://localhost:8000/v2/api/pet/1234/uploadImage\'');
  });

  it('gets an server side 404, and verifies that the content-type in the response is correct, and different than one in the request', function (done) {
    var petApi = sample.pet;

    // This test will actually hit the 404 path of mock server, which we use to test the content-type is correct
    petApi.findPetsByStatus({status: undefined}, function (resp) {
      expect(resp.headers).toNotBe(undefined);
      expect(resp.headers['content-type']).toNotBe(undefined);
      expect(resp.headers['content-type']).toBe('text/plain');

      done('should have failed');
    }, function(err) {
      expect(err.headers).toNotBe(undefined);
      expect(err.headers['content-type']).toNotBe(undefined);
      expect(err.headers['content-type']).toBe('text/plain');

      done();
    });
  });

  it('calls the error handler with missing params per #375', function(done) {
    var petApi = sample.pet;
    petApi.getPetById({}, function(data){
      console.log('shoulda failed!' + data);
    }, function() {
      done();
    });
  });

  it('escapes a param per #280', function () {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 'foo/bar'}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/foo%2Fbar');
  });
});


describe('swagger host override functions', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();

    sample.clientAuthorizations.authz = {};
    done();
  });

  it('overrides a host https://github.com/swagger-api/swagger-ui/issues/532', function () {
    sample.setHost('foo:9000');
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 'foo/bar'}, {mock: true});

    test.object(req);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://foo:9000/v2/api/pet/foo%2Fbar');
  });
});

describe('swagger basePath override functions', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  it('provides an error object per #549', function(done) {
    var petApi = sample.pet;
    petApi.getPetById({petId: 666}, function(success){
      console.log(success);
      done();
    }, function(err){
      expect(err.obj).toBeAn('object');
      expect(err.obj.code).toBe(400);
      expect(err.obj.type).toBe('bad input');
      expect(err.obj.message).toBe('sorry!');
      done();
    });
  });

  it('applies a request interceptor per #601', function(done) {
    var petApi = sample.pet;
    var requestInterceptor = {
      apply: function(data) {
        // rewrites an invalid pet id (-100) to be valid (1)
        // you can do what you want here, like inject headers, etc.
        data.url = 'http://localhost:8000/v2/api/pet/1';
        return data;
      }
    };

    petApi.getPetById({petId: -100}, {requestInterceptor: requestInterceptor}, function(success){
      expect(success.obj).toBeAn('object');
      expect(success.obj.id).toBe(1);
      done();
    }, function(err){
      expect(err.obj).toBeAn('object');
      expect(err.obj.code).toBe(400);
      expect(err.obj.type).toBe('bad input');
      expect(err.obj.message).toBe('sorry!');
      done();
    });
  });

  it('applies both a request and response interceptor per #601', function(done) {
    var petApi = sample.pet;
    var startTime = 0;
    var elapsed = 0;

    var interceptor = {
      requestInterceptor: {
        apply: function (data) {
          // rewrites an invalid pet id (-100) to be valid (1)
          // you can do what you want here, like inject headers, etc.
          startTime = new Date().getTime();
          return data;
        }
      },
      responseInterceptor: {
        apply: function (data) {
          elapsed = new Date().getTime() - startTime;
          return data;
        }
      }
    };

    petApi.getPetById({petId: 1}, {
      requestInterceptor: interceptor.requestInterceptor,
      responseInterceptor: interceptor.responseInterceptor
    }, function(success){
      expect(success.obj).toBeAn('object');
      expect(success.obj.id).toBe(1);
      expect(elapsed).toBeGreaterThan(0);
      done();
    }, function(err){
      expect(err.obj).toBeAn('object');
      expect(err.obj.code).toBe(400);
      expect(err.obj.type).toBe('bad input');
      expect(err.obj.message).toBe('sorry!');
      done();
    });
  });

  it('applies a request interceptor to asCurl #903', function() {
    var petApi = sample.pet;
    var requestInterceptor = {
      apply: function(data) {
        data.url = 'http://localhost:8000/v2/api/pet/1';
        return data;
      }
    };

    var curl = petApi.getPetById.asCurl({petId: -100}, {requestInterceptor: requestInterceptor});
    expect(curl).toBe('curl -X GET --header \'Accept: application/json\' \'http://localhost:8000/v2/api/pet/1\'');
  });

  it('applies request interceptor and waits for beforeSend as per #701', function(done) {
    this.timeout(10000);
    var petApi = sample.pet;
    var startTime = new Date().getTime();
    var elapsed = 0;

    var interceptor = {
      requestInterceptor: {
        apply: function (data) {
          data.beforeSend = function(_done) {
            // simulate async
            setTimeout(function() {
              _done(data);
            }, 600);
          };
          return data;
        }
      },
      responseInterceptor: {
        apply: function (data) {
          elapsed = new Date().getTime() - startTime;
          return data;
        }
      }
    };

    petApi.getPetById({petId: 1}, {
      requestInterceptor: interceptor.requestInterceptor,
      responseInterceptor: interceptor.responseInterceptor
    }, function(success){
      expect(success.obj).toBeAn('object');
      expect(success.obj.id).toBe(1);
      expect(elapsed).toBeGreaterThan(500);
      done();
    }, function(err){
      expect(err.obj).toBeAn('object');
      expect(err.obj.code).toBe(400);
      expect(err.obj.type).toBe('bad input');
      expect(err.obj.message).toBe('sorry!');
      done();
    });
  });


  it('overrides a basePath https://github.com/swagger-api/swagger-ui/issues/532', function (done) {
    sample.setBasePath('/bar');
    var petApi = sample.pet;
    var req = petApi.deletePet({petId: 'foo/bar'}, {mock: true});

    test.object(req);

    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/bar/pet/foo%2Fbar');

    done();
  });

  after(function (done){
    instance.close();

    sample.clientAuthorizations.authz = {};
    done();
  });
});
