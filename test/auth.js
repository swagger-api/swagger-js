/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var mock = require('./mock');
var swagger = require('..');
var sample, instance;

describe('2.0 authorizations', function () {
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

  it('applies an api key to the query string', function () {
    var params = { petId: 1 };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('api_key', 'abc123', 'query');

    sample.clientAuthorizations.add('api_key', auth);

    var petApi = sample.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1?api_key=abc123');

    sample.clientAuthorizations.authz = {};
  });

  it('applies an api key as a header', function () {
    var params = { petId: 1 };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('api_key', 'abc123', 'header');

    sample.clientAuthorizations.add('api_key', auth);

    var petApi = sample.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).toBe('http://localhost:8000/v2/api/pet/1');
    expect(req.headers.api_key).toBe('abc123'); // jshint ignore:line

    sample.clientAuthorizations.authz = {};
  });

  it('does not apply security where it is explicitly not required', function () {
    var params = { username: 'Johnny', password: 'Walker' };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('api_key', 'abc123', 'header');

    sample.clientAuthorizations.add('api_key', auth);

    var userApi = sample.user;
    var req = userApi.loginUser(params, opts);

    expect(req.headers.api_key).toBe(undefined); // jshint ignore:line
  });

});
