/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var mock = require('./mock');
var swagger = require('../..');
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
    sample.clientAuthorizations.authz = {};
    done();
  });

  it('applies an api key to the query string', function() {
    var params = { petId: 1 };
    var opts = {
      requestContentType: null,
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('api_key', 'abc123', 'query');

    sample.clientAuthorizations.add('key', auth);

    var petApi = sample.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).toBe('http://localhost:8001/v1/api/pet/1?api_key=abc123');

    sample.clientAuthorizations.authz = {};
  });

  it('applies an api key as a header', function() {
    var params = { petId: 1 };
    var opts = {
      requestContentType: null,
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('api_key', 'abc123', 'header');

    sample.clientAuthorizations.add('key', auth);

    var petApi = sample.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).toBe('http://localhost:8001/v1/api/pet/1');
    expect(req.headers.api_key).toBe('abc123'); // jshint ignore:line

    sample.clientAuthorizations.authz = {};
  });

  it('doesn\'t encode a header key name and value', function() {
    var params = { petId: 1 };
    var opts = {
      requestContentType: null,
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('Authorization: Bearer', 'a b c d e', 'header');

    sample.clientAuthorizations.add('key', auth);

    var petApi = sample.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).toBe('http://localhost:8001/v1/api/pet/1');
    expect(req.headers['Authorization: Bearer']).toBe('a b c d e');

    sample.clientAuthorizations.authz = {};
  });

  it('propigates authorization from the resource', function() {
    var params = { orderId: 1 };
    var opts = {
      requestContentType: null,
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new swagger.ApiKeyAuthorization('privateKey', 'a b c d e', 'header');

    sample.clientAuthorizations.add('privateKey', auth);

    var storeApi = sample.store;

    var req = storeApi.getOrderById(params, opts);

    expect(req.url).toBe('http://localhost:8001/v1/api/store/order/1');
    expect(req.headers.privateKey).toBe('a b c d e');
  });
});
