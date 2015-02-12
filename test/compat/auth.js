var test = require('unit.js');
var expect = require('expect');
var mock = require('../../test/compat/mock');
var swagger = require('../../lib/swagger-client');
var sample, instance;

describe('1.2 api key authorizations', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    swagger.authorizations.authz = {};
    done();
  });

  it('applies an api key to the query string', function() {
    params = { petId: 1 };
    opts = {
      requestContentType: null,
      responseContentType: "application/json",
      mock: true
    };

    var auth = new swagger.ApiKeyAuthorization("api_key", "abc123", "query");
    swagger.authorizations.add("key", auth);

    var petApi = sample.pet;

    var req = petApi.getPetById(params, opts);
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/1?api_key=abc123');
    swagger.authorizations.authz = {};
  });

  it('applies an api key as a header', function() {
    params = { petId: 1 };
    opts = {
      requestContentType: null,
      responseContentType: "application/json",
      mock: true
    };

    var auth = new swagger.ApiKeyAuthorization("api_key", "abc123", "header");
    swagger.authorizations.add("key", auth);

    var petApi = sample.pet;

    var req = petApi.getPetById(params, opts);
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/1');
    expect(req.headers.api_key).toBe('abc123');
    swagger.authorizations.authz = {};
  });

  it('doesn\'t encode a header key name and value', function() {
    params = { petId: 1 };
    opts = {
      requestContentType: null,
      responseContentType: "application/json",
      mock: true
    };

    var auth = new swagger.ApiKeyAuthorization("Authorization: Bearer", "a b c d e", "header");
    swagger.authorizations.add("key", auth);

    var petApi = sample.pet;

    var req = petApi.getPetById(params, opts);
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/1');
    expect(req.headers['Authorization: Bearer']).toBe('a b c d e');
    swagger.authorizations.authz = {};
  });
});
