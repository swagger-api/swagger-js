/* global  beforeEach, describe, it */

'use strict';

var expect = require('chai').expect;
var nock = require('nock');
var petstore;
var domain = 'http://example.com';

var Swagger = require('..');
var Auth = require('./auth');


/**
 * These are slightly different tests, as in they use http mocking rather than a test server.
 * This is to showcase this alternative, in order to see if we can't migrate our other tests toward it
 */

describe('2.0 authorizations', function () {

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
    var client = new Swagger('',{
      authorizations: {
        'someAuth': auth
      }
    });

    expect(client.clientAuthorizations.authz.someAuth).to.equal(auth);

  });

  it('should have auth available when fetching the spec', function(done){
    var uri = '/somespec.json';

    // Mock out the request, will only allow one request
    nock(domain)
      .get(uri)
      .reply(function () {
        expect(this.req.headers).to.include.keys('swagger');
        expect(this.req.headers.swagger).to.equal('awesome');
        return {swagger: '2.0', title: 'test'}; // minimal, so that we don't break anything
      });

    var swag = new Swagger({
      url: domain + uri,
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
    expect(req.headers.api_key).to.equal('abc123'); // jshint ignore:line

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

});
