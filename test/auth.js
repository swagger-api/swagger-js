var test = require('unit.js');
var expect = require('expect');
var mock = require('../test/mock');
var swagger = require('../lib/swagger-client');
var sample, instance;

describe('2.0 authorizations', function() {
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
      responseContentType: "application/json",
      mock: true
    };

    var auth = new swagger.ApiKeyAuthorization("api_key", "abc123", "query");
    swagger.authorizations.add("api_key", auth);

    var petApi = sample.pet;

    var req = petApi.getPetById(params, opts);
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1?api_key=abc123');
    swagger.authorizations.authz = {};
  });

  it('applies an api key as a header', function() {
    params = { petId: 1 };
    opts = {
      responseContentType: "application/json",
      mock: true
    };

    var auth = new swagger.ApiKeyAuthorization("api_key", "abc123", "header");
    swagger.authorizations.add("api_key", auth);

    var petApi = sample.pet;

    var req = petApi.getPetById(params, opts);
    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1');
    expect(req.headers['api_key']).toBe('abc123');
    swagger.authorizations.authz = {};
  });

  it('does not apply security where it is explicitly not required', function () {
    params = { username: 'Johnny', password: 'Walker' };
    opts = {
      responseContentType: "application/json",
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization("api_key", "abc123", "header");
    swagger.authorizations.add("api_key", auth);

    var userApi = sample.user;
    var req = userApi.loginUser(params, opts);
    expect(req.headers.api_key).toEqual('abc123');
  });

});