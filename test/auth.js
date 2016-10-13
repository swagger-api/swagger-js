/* global  after, before, beforeEach, describe, it */

'use strict';

var expect = require('chai').expect;
var fauxjax = require('faux-jax');

var Swagger = require('..');
var petstore;
var Operation = require('../lib/types/operation');
var auth = require('../lib/auth');

/**
 * These are slightly different tests, as in they use http mocking rather than a test server.
 * This is to showcase this alternative, in order to see if we can't migrate our other tests toward it
 */

describe('2.0 authorizations', function () {
  before(function(){
    fauxjax.install();
  });

  after(function(){
    fauxjax.restore();
    fauxjax.removeAllListeners();
  });

  beforeEach(function(done){
    petstore = new Swagger({
      spec: require('./spec/v2/petstore.json'),
      success: done,
      failure: function (err) {
        throw err;
      }
    });
  });

  it('adds given hash to the auth object', function(){
    // I don't really care what it adds...
    var auth = {foo: 'bar'};
    var client = new Swagger({
      authorizations: {
        'someAuth': auth
      }
    });

    expect(client.clientAuthorizations.authz.someAuth).to.equal(auth);

  });
/*
  // re-enable after https://github.com/swagger-api/swagger-js/issues/711
  it('should have auth available when fetching the spec', function(done){
    var url = 'http://example.com/not_important';

    // Mock out the request, will only allow one request
    fauxjax.once('request', function (req) {

      expect(req.requestHeaders).to.include.keys('swagger');
      expect(req.requestHeaders.swagger).to.equal('awesome');

      // Send something back, so we don't crash swagger
      req.respond( 200, { }, JSON.stringify({swagger: '2.0', title: 'test'}));
    });

    var swag = new Swagger({
      url: url,
      authorizations: {
        someAuth: function () {
          this.headers.swagger  = 'awesome';
        }
      },
      success: function () {
        expect(swag.title).to.equal('test'); // Make sure we actually went through with the request
        done();
      },
      failure: function (err) { throw err; }
    });
  });
  */

  it('should have clientAuthorizations instantiated before #initialize', function(){
    var client = new Swagger(); // don't initialize here, no-args
    expect(client.clientAuthorizations).to.respondTo('add'); // ie: it has an 'add' function
  });

  it('applies an api key to the query string', function () {
    var params = { petId: 1 };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new Swagger.ApiKeyAuthorization('api_key', 'abc123', 'query');

    petstore.clientAuthorizations.add('api_key', auth);

    var petApi = petstore.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).to.equal('http://localhost:8000/v2/api/pet/1?api_key=abc123');
  });

  it('applies an api key as a header', function () {
    var params = { petId: 1 };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new Swagger.ApiKeyAuthorization('api_key', 'abc123', 'header');

    petstore.clientAuthorizations.add('api_key', auth);

    var petApi = petstore.pet;
    var req = petApi.getPetById(params, opts);

    expect(req.url).to.equal('http://localhost:8000/v2/api/pet/1');
    expect(req.headers['api_key']).to.equal('abc123'); // jshint ignore:line

    petstore.clientAuthorizations.authz = {};
  });

  it('does not apply security where it is explicitly not required', function () {
    var params = { username: 'Johnny', password: 'Walker' };
    var opts = {
      responseContentType: 'application/json',
      mock: true
    };
    var auth = new Swagger.ApiKeyAuthorization('api_key', 'abc123', 'header');

    petstore.clientAuthorizations.add('api_key', auth);

    var userApi = petstore.user;
    var req = userApi.loginUser(params, opts);

    expect(req.headers.api_key).to.equal(undefined); // jshint ignore:line
  });

  it('does not apply api-key headers when the value has been manually added', function () {
    var params = { 'api_key': 'foo' };

    var parameters = [
      {
        in: 'header',
        name: 'api_key',
        type: 'string'
      }
    ];
    var authorizations = new auth.SwaggerAuthorizations();
    authorizations.add('Basic', new auth.ApiKeyAuthorization('api_key', 'bar', 'header'));
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, authorizations);
    var req = op.execute(params, {mock : true});
    expect(req.headers['api_key']).to.equal('foo');
  });

  it('does not apply password auth when the value has been manually added', function () {
    var params = { Authorization: 'foo' };

    var parameters = [
      {
        in: 'header',
        name: 'Authorization',
        type: 'string'
      }
    ];
    var authorizations = new auth.SwaggerAuthorizations();
    authorizations.add('Basic', new auth.PasswordAuthorization('bar', 'baz'));
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, authorizations);
    var req = op.execute(params, {mock : true});
    expect(req.headers.Authorization).to.equal('foo');
  });

  /*
   // re-enable after https://github.com/swagger-api/swagger-js/issues/711

  it('applies multiple auths', function (done) {
    var url = 'http://example.com/multiple_auths';

    // Mock out the request, will only allow one request
    fauxjax.once('request', function (req) {
      expect(req.requestHeaders).to.include.keys('auth');
      expect(req.requestHeaders.auth).to.equal('val');

      expect(req.requestHeaders).to.include.keys('auth1');
      expect(req.requestHeaders.auth1).to.equal('val1');

      // Send something back, so we don't crash swagger
      req.respond( 200, { }, JSON.stringify({swagger: '2.0', title: 'test'}));
    });

    var swag = new Swagger({
      url: url,
      authorizations: {
        auth: function() {
          this.headers.auth = 'val';
          return true;
        },
        auth1: function() {
          this.headers.auth1 = 'val1';
          return true;
        },
      },
      success: function () {
        expect(swag.title).to.equal('test'); // Make sure we actually went through with the request
        done();
      },
      failure: function (err) { throw err; }
    });
  });
  */
});
